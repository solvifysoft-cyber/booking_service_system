import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { AfriPayValidationService } from './afripay-validation.service';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, AfriPayValidationService],
})
export class PaymentsModule {}
