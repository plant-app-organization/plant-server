import { Test, TestingModule } from '@nestjs/testing'
import { MailinglistController } from './mailinglist.controller'

describe('MailinglistController', () => {
  let controller: MailinglistController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MailinglistController],
    }).compile()

    controller = module.get<MailinglistController>(MailinglistController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
