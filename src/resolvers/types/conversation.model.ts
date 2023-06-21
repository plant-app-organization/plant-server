import { Field, Int, ObjectType, ID, Float } from '@nestjs/graphql'
import { Conversation as ConversationClient } from '@prisma/client'

@ObjectType()
export class Conversation implements ConversationClient {
  @Field(() => ID)
  id: string

  @Field(() => String)
  participantIds: string[]

  @Field(() => String)
  offerId: string

  @Field(() => Boolean)
  isActive: boolean

  @Field(() => Date)
  createdAt: Date

  @Field(() => Date)
  updatedAt: Date
}
