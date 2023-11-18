import { Field, Int, ObjectType, ID, Float } from '@nestjs/graphql'
import { Suggestion as SuggestionClient } from '@prisma/client'

@ObjectType()
export class SuggestionModel implements SuggestionClient {
  @Field(() => ID)
  id: string

  @Field(() => String)
  title: string

  @Field(() => Date)
  createdAt: Date

  @Field(() => Date)
  updatedAt: Date
}
