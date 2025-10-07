import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class AfriPayValidationService {
  private readonly secretKey: string;

  constructor() {
    // Get secret key from environment variables
    this.secretKey = process.env.AFRIPAY_SECRET_KEY || '';
    if (!this.secretKey) {
      console.warn('AFRIPAY_SECRET_KEY not found in environment variables');
    }
  }

  /**
   * Validate AfriPay callback signature
   * @param payload - The callback payload
   * @param signature - The signature from AfriPay
   * @returns boolean - Whether the signature is valid
   */
  validateSignature(payload: any, signature: string): boolean {
    if (!this.secretKey) {
      console.warn('AfriPay secret key not configured, skipping signature validation');
      return true; // Allow callback if no secret key is configured
    }

    if (!signature) {
      console.error('No signature provided in AfriPay callback');
      return false;
    }

    try {
      // Create the signature string from the payload
      const signatureString = this.createSignatureString(payload);
      
      // Generate expected signature
      const expectedSignature = crypto
        .createHmac('sha256', this.secretKey)
        .update(signatureString)
        .digest('hex');

      // Compare signatures
      const isValid = crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );

      if (!isValid) {
        console.error('AfriPay signature validation failed');
        console.error('Expected:', expectedSignature);
        console.error('Received:', signature);
      }

      return isValid;
    } catch (error) {
      console.error('Error validating AfriPay signature:', error);
      return false;
    }
  }

  /**
   * Create signature string from payload
   * AfriPay typically sends specific fields for signature validation
   */
  private createSignatureString(payload: any): string {
    // AfriPay signature typically includes these fields in order
    const signatureFields = [
      'status',
      'transaction_ref',
      'client_token',
      'amount',
      'currency',
      'payment_method'
    ];

    const signatureData = signatureFields
      .map(field => payload[field] || '')
      .join('|');

    return signatureData;
  }

  /**
   * Validate required callback fields
   */
  validateCallbackFields(payload: any): { isValid: boolean; missingFields: string[] } {
    const requiredFields = ['status', 'client_token'];
    const missingFields: string[] = [];

    for (const field of requiredFields) {
      if (!payload[field]) {
        missingFields.push(field);
      }
    }

    return {
      isValid: missingFields.length === 0,
      missingFields
    };
  }

  /**
   * Sanitize callback data to prevent injection attacks
   */
  sanitizeCallbackData(payload: any): any {
    const sanitized: any = {};

    for (const [key, value] of Object.entries(payload)) {
      if (typeof value === 'string') {
        // Remove potentially dangerous characters
        sanitized[key] = value.replace(/[<>\"'&]/g, '');
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }
}

