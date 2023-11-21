import { InputType, Field } from '@nestjs/graphql'

@InputType()
export class MessageInput {
  @Field()
  offerId: string

  @Field()
  existingConversationId: string

  @Field()
  text: string
}
