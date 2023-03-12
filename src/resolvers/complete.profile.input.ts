import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CompleteProfileInput {
  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field()
  password: string;

  @Field()
  phoneNumber: string;

  @Field()
  userBio: string;

  @Field()
  avatar: number;
}
