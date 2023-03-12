import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class OfferInput {
  @Field()
  price: number;

  @Field()
  plantName: string;

  @Field()
  pictureUrl: string;

  @Field()
  cathegory: string;

  @Field()
  health: string;

  @Field()
  size: number;

  @Field()
  age: number;

  @Field()
  description: string;
}
