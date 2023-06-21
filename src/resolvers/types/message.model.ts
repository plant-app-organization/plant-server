import { Field, Int, ObjectType, ID, Float } from '@nestjs/graphql'
import { Message as MessageClient } from '@prisma/client'

@ObjectType()
export class MessageModel implements MessageClient {
  @Field(() => ID)
  id: string

  @Field(() => String)
  senderId: string

  @Field(() => String)
  conversationId: string

  @Field(() => String)
  text: string

  @Field(() => Boolean)
  isActive: boolean

  @Field(() => Date)
  createdAt: Date

  @Field(() => Date)
  updatedAt: Date
}
