import { Query, Resolver } from '@nestjs/graphql';

@Resolver()
export class HelloResolver {
  @Query((returns) => String)
  async hello() {
    console.log('dans le resolver hello');
    return 'Hello, World';
  }
}
