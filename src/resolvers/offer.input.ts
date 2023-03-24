import { InputType, Field } from '@nestjs/graphql'

@InputType()
export class OfferInput {
  @Field()
  price: number

  @Field()
  plantName: string

  @Field(() => [String])
  pictures: string[]

  @Field()
  description: string

  @Field()
  category: string

  @Field()
  health: string

  @Field()
  maintenanceDifficultyLevel: string

  @Field()
  pot: boolean

  @Field()
  plantHeight: number
}
