import { Resolver, Mutation, Args, Context, Query, Subscription } from '@nestjs/graphql'
import { Message } from '@prisma/client'
import { MessageInput } from './message.input'
import { PrismaService } from '../prisma.service'
import clerk, { sessions } from '@clerk/clerk-sdk-node'
import { MessageModel } from './types/message.model'
import { ConversationModel } from './types/conversation.model'
import { PubSub } from 'graphql-subscriptions'

const pubSub = new PubSub()

@Resolver()
export class MessagesResolver {
  constructor(private prisma: PrismaService) {}

  @Mutation(() => String)
  async sendMessage(
    @Context() context,
    @Args('newMessageInput') messageInput: MessageInput,
  ): Promise<boolean> {
    console.log('🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥messageInput in sendMessage resolver', messageInput)
    const authorizationHeader = context.req.headers.authorization
    const token = authorizationHeader.split(' ')[1] // extract the token from the header
    const client = await clerk.clients.verifyClient(token)
    const foundUser = await this.prisma.user.findUnique({
      where: {
        clerkId: client.sessions[0].userId,
      },
    })
    console.log('foundUser in sendMessage()', foundUser)

    if (foundUser) {
      // get the receiverId from the offerId
      const offer = await this.prisma.offer.findUnique({
        where: { id: messageInput.offerId },
      })
      const receiverId = offer.authorId
      // check if conversation already exists
      let conversation = await this.prisma.conversation.findFirst({
        where: {
          AND: [
            {
              participantIds: {
                has: foundUser.id,
              },
            },
            {
              participantIds: {
                has: receiverId,
              },
            },
            {
              offerId: messageInput.offerId,
            },
          ],
        },
      })

      console.log('found conversation :', conversation)

      // if no conversation exists, create new conversation
      if (!conversation) {
        console.log('conversation didnt exist')
        conversation = await this.prisma.conversation.create({
          data: {
            offerId: messageInput.offerId,
            participantIds: [foundUser.id, receiverId],
          },
        })

        console.log('👉🏻new Conversation created in DB ')
      }

      // Create new message document in DB
      const newMessage = await this.prisma.message.create({
        data: {
          senderId: foundUser.id,
          conversationId: conversation.id,
          text: messageInput.text,
        },
      })

      console.log('👉🏻newMessage created in DB ', newMessage)
      await pubSub.publish(`messageAdded.${conversation.id}`, { messageAdded: newMessage })

      return true
    }

    throw new Error('User not found or not authorized')
  }

  // check if conversation is already created between two users about   an offer
  @Query(() => String)
  async getIsConversationExisting(
    @Context() context,
    @Args('userId1') userId1: string,
    @Args('offerId') offerId: string,
  ): Promise<string> {
    console.log('Data in getIsConversationExisting', 'userId1', userId1, 'offerId', offerId)

    const authorizationHeader = context.req.headers.authorization
    const token = authorizationHeader.split(' ')[1] // extract the token from the header
    const client = await clerk.clients.verifyClient(token)
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

  @Query(() => [ConversationModel], {
    name: 'UserConversations',
    description: 'Get all conversations of the authenticated user',
  })
  async getUserConversations(@Context() context): Promise<any> {
    const authorizationHeader = context.req.headers.authorization
    const token = authorizationHeader.split(' ')[1] // extract the token from the header
    const client = await clerk.clients.verifyClient(token)
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
        createdAt: 'desc',
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
