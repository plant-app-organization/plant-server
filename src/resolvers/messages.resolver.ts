import { Resolver, Mutation, Args, Context, Query, Subscription } from '@nestjs/graphql'
import { Message } from '@prisma/client'
import { MessageInput } from './message.input'
import { PrismaService } from '../prisma.service'
import clerk, { sessions } from '@clerk/clerk-sdk-node'
import { MessageModel } from './types/message.model'
import { SendMessageResponse } from './types/sendMessageResponse'
import { ConversationModel } from './types/conversation.model'
import { PubSub } from 'graphql-subscriptions'
import * as sgMail from '@sendgrid/mail'
import axios from 'axios'

sgMail.setApiKey(process.env.SENDGRID_API_KEY)
const pubSub = new PubSub()

@Resolver()
export class MessagesResolver {
  constructor(private prisma: PrismaService) {}

  @Mutation(() => SendMessageResponse)
  async sendMessage(
    @Context() context,
    @Args('newMessageInput') messageInput: MessageInput,
  ): Promise<SendMessageResponse> {
    if (!context.req.headers.authorization) {
      throw new Error('Authorization header is missing')
    }

    const authorizationHeader = context.req.headers.authorization
    const token = authorizationHeader.split(' ')[1]
    const client = await clerk.clients.verifyClient(token)

    if (!client) {
      throw new Error('Invalid client token')
    }

    const foundUser = await this.prisma.user.findUnique({
      where: {
        clerkId: client.sessions[0].userId,
      },
    })

    if (!foundUser) {
      throw new Error('User not found')
    }

    const offer = await this.prisma.offer.findUnique({
      where: { id: messageInput.offerId },
    })

    if (!offer) {
      throw new Error('Offer not found')
    }

    const receiverId = offer.authorId
    let conversation = await this.prisma.conversation.findFirst({
      where: {
        AND: [
          { participantIds: { has: foundUser.id } },
          { participantIds: { has: receiverId } },
          { offerId: messageInput.offerId },
        ],
      },
    })
    console.log('-> conversation trouvée', conversation.id)

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          offerId: messageInput.offerId,
          participantIds: [foundUser.id, receiverId],
        },
      })
    }

    const newMessage = await this.prisma.message.create({
      data: {
        senderId: foundUser.id,
        conversationId: conversation.id,
        text: messageInput.text,
      },
    })

    await pubSub.publish(`messageAdded.${conversation.id}`, { messageAdded: newMessage })

    const secondParticipantId = conversation.participantIds.find((id) => id !== foundUser.id)
    const secondParticipant = await this.prisma.user.findUnique({
      where: { id: secondParticipantId },
    })

    // Envoi de la notification push (ne pas attendre la réponse)
    axios
      .post(`https://app.nativenotify.com/api/indie/notification`, {
        subID: secondParticipant.email,
        appId: 15168,
        appToken: '2NQv5UM3ppjj8VIDgMfgb4',
        title: `✉️ Nouveau message de ${foundUser.userName}`,
        message: messageInput.text,
      })
      .catch((error) => console.error('Erreur notification push:', error))

    // Envoi de l'email (ne pas attendre la réponse)
    const msg = {
      to: secondParticipant.email,
      from: process.env.SENDGRID_EMAIL_SENDER,
      templateId: 'd-82f09607fd314d32b3ee8960efce9f96',
      dynamic_template_data: {
        senderName: foundUser.userName,
        plantName: offer.plantName,
        picture: offer.pictures[0],
        message: messageInput.text,
      },
    }

    sgMail.send(msg).catch((error) => console.error('Erreur envoi email:', error))

    return { result: true, conversationId: conversation.id }
  }
  // console.log('🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥messageInput in sendMessage resolver', messageInput)

  // check if conversation is already created between two users about   an offer
  @Query(() => String)
  async getIsConversationExisting(
    @Context() context,
    @Args('userId1') userId1: string,
    @Args('offerId') offerId: string,
  ): Promise<string> {
    console.log('Data in getIsConversationExisting', 'userId1', userId1, 'offerId', offerId)
    if (context.req.headers.authorization) {
      const authorizationHeader = context.req.headers.authorization
      const token = authorizationHeader.split(' ')[1] // extract the token from the header
      const client = await clerk.clients.verifyClient(token)

      if (client) {
        const foundUser = await this.prisma.user.findUnique({
          where: {
            clerkId: client.sessions[0].userId,
          },
        })
        console.log('foundUser in sendMessage()', foundUser)

        if (foundUser) {
          const foundConversation = await this.prisma.conversation.findFirst({
            where: {
              AND: [
                {
                  participantIds: { has: userId1 },
                },
                {
                  participantIds: { has: foundUser.id },
                },
                {
                  offerId: offerId,
                },
              ],
            },
          })

          console.log('☀️foundConversation', foundConversation)

          return foundConversation ? foundConversation.id : null
        } else {
          throw new Error('Access denied')
        }
      }
    }
  }

  @Query(() => [ConversationModel], {
    name: 'UserConversations',
    description: 'Get all conversations of the authenticated user',
  })
  async getUserConversations(@Context() context): Promise<any> {
    if (context.req.headers.authorization) {
      const authorizationHeader = context.req.headers.authorization
      const token = authorizationHeader.split(' ')[1] // extract the token from the header
      const client = await clerk.clients.verifyClient(token)
      if (client) {
        const foundUser = await this.prisma.user.findUnique({
          where: {
            clerkId: client.sessions[0].userId,
          },
        })

        if (foundUser) {
          const userConversations = await this.prisma.conversation.findMany({
            where: {
              participantIds: {
                has: foundUser.id,
              },
            },
            include: {
              offer: {
                select: {
                  authorId: true,
                  category: true,
                  createdAt: true,
                  description: true,
                  health: true,
                  id: true,
                  isActive: true,
                  maintenanceDifficultyLevel: true,
                  pictures: true,
                  plantHeight: true,
                  plantName: true,
                  environment: true,
                  latitude: true,
                  longitude: true,
                  pot: true,
                  price: true,
                  updatedAt: true,
                  city: true,
                },
              },
            },
          })

          // Fetch participant details for each conversation
          const populatedConversations = await Promise.all(
            userConversations.map(async (conversation) => {
              const participants = (
                await this.prisma.user.findMany({
                  where: {
                    id: {
                      in: conversation.participantIds,
                    },
                  },
                  select: {
                    userName: true,
                    avatar: true,
                    id: true,
                  },
                })
              ).filter((participant) => participant.id !== foundUser.id)

              return {
                ...conversation,
                participants,
              }
            }),
          )
          console.log('=>', populatedConversations)
          return populatedConversations
        } else {
          throw new Error('Access denied')
        }
      }
    }
  }

  @Query((returns) => [MessageModel], {
    name: 'MessagesList',
    description: 'Get List of Messages for a given conversation',
  })
  async getConversationMessages(
    @Args('conversationId') conversationId: string,
  ): Promise<Message[]> {
    console.log('conversationId in getConversationMessages', conversationId)
    const conversationData = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: {
        createdAt: 'asc',
      },
    })
    console.log('conversatIONData', conversationData)
    return conversationData
  }

  @Subscription(() => MessageModel, {
    name: 'messageAdded',
    filter: (payload, variables) =>
      payload.messageAdded.conversationId === variables.conversationId,
  })
  messageAdded(@Args('conversationId', { type: () => String }) conversationId: string) {
    console.log('New message published')
    return pubSub.asyncIterator(`messageAdded.${conversationId}`)
  }
}
