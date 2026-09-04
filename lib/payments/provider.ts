import type { JsonObject } from "@/lib/football/types";

export interface InitializePaymentInput {
  email: string;
  amountMinor: number;
  currency: string;
  reference: string;
  callbackUrl: string;
  metadata: JsonObject;
}

export interface InitializedPayment {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

export interface VerifiedPayment {
  reference: string;
  providerReference: string;
  status: string;
  amountMinor: number;
  currency: string;
  customerEmail: string;
  gatewayResponse: string | null;
  paidAt: Date | null;
  raw: JsonObject;
}

export interface PaymentProviderAdapter {
  initialize(input: InitializePaymentInput): Promise<InitializedPayment>;
  verify(reference: string): Promise<VerifiedPayment>;
}
