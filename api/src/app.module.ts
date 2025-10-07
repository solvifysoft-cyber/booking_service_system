import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { LoginModule } from './login/login.module';
import { ServisesModule } from './servises/servises.module';
// Add this import for the upload controller
import { UploadController } from './upload/upload.controller';
import { PaymentsModule } from './payments/payments.module';
import { AvailabilityModule } from './availability/availability.module';
import { PasswordResetModule } from './password-reset/password-reset.module';
import { FeedbackModule } from './feedback/feedback.module';
import { InvoiceModule } from './invoice/invoice.module';
import { FoodDeliveryModule } from './food-delivery/food-delivery.module';

@Module({
  imports: [
    UserModule,
    LoginModule,
    ServisesModule,
    PaymentsModule,
    AvailabilityModule,
    PasswordResetModule,
    FeedbackModule,
    InvoiceModule,
    FoodDeliveryModule,
  ],
  controllers: [UploadController], // Register the upload controller
})
export class AppModule {}
