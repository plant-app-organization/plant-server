import { Field, Int, ObjectType, ID, Float } from '@nestjs/graphql'
import { Conversation as ConversationClient } from '@prisma/client'
import { UserModel } from './user.model'

import { Offer } from './offer.model'
@ObjectType()
export class ConversationModel implements ConversationClient {
  @Field(() => ID)
  id: string

  @Field(() => String)
  participantIds: string[]

  @Field(() => [UserModel])
  participants: UserModel[]

  @Field(() => String)
  offerId: string

  @Field(() => Offer)
  offer: Offer

  @Field(() => Boolean)
  isActive: boolean

  @Field(() => Date)
  createdAt: Date

  @Field(() => Date)
  updatedAt: Date
}
