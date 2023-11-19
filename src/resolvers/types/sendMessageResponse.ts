import { ObjectType, Field } from '@nestjs/graphql'

@ObjectType()
export class SendMessageResponse {
  @Field(() => Boolean)
  result: boolean

  @Field(() => String)
  conversationId: string
}
