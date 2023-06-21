import { Resolver, Mutation, Args, Context, Query } from '@nestjs/graphql'
import { Message } from '@prisma/client'
import { MessageInput } from './message.input'
import { PrismaService } from '../prisma.service'
import clerk, { sessions } from '@clerk/clerk-sdk-node'
import { MessageModel } from './types/message.model'

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

      return true
    }

    throw new Error('User not found or not authorized')
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
}
