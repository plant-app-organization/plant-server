import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class OfferInput {
  @Field()
  price: number;

  @Field()
  plantName: string;

  @Field()
  pictureUrl: string;
}
