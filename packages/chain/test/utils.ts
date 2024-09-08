import { UInt64 } from "@proto-kit/library";

export const mockFetchUSDPrices = () => {
  return [
    UInt64.from(42_037_400), //mMINA
    UInt64.from(633_853_500), //mUNI
    UInt64.from(37_676_684), //mMATIC
    UInt64.from(99_972_636), //mUSDT
    UInt64.from(49_720_743), //mARB
    UInt64.from(1_021_282_366), //mLINK
  ];
};
