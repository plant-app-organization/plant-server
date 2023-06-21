import { InputType, Field } from '@nestjs/graphql'

@InputType()
export class MessageInput {
  @Field()
  offerId: string

  @Field()
  text: string
}
