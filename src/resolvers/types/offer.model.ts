import { Field, Int, ObjectType, ID } from '@nestjs/graphql'
import { Offer as OfferClient } from '@prisma/client'

@ObjectType()
export class Offer implements OfferClient {
  @Field(() => ID)
  id: string

  @Field(() => String)
  authorId: string

  @Field(() => Int)
  price: number

  @Field(() => String)
  plantName: string

  @Field(() => [String])
  pictures: string[]

  @Field(() => String)
  description: string

  @Field(() => String)
  category: string

  @Field(() => String)
  health: string

  @Field(() => Boolean)
  pot: boolean

  @Field(() => Int)
  plantHeight: number

  @Field(() => String)
  maintenanceDifficultyLevel: string

  @Field(() => Boolean)
  isActive: boolean

  @Field(() => Date)
  createdAt: Date

  @Field(() => Date)
  updatedAt: Date
}
