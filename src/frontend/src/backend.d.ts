import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface LeaderboardEntry {
    principal?: Principal;
    name: string;
    profit: number;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export type Time = bigint;
export interface AppNotification {
    id: bigint;
    title: string;
    body: string;
    timestamp: Time;
    isRead: boolean;
    notifType: string;
    owner: Principal;
}
export interface ChatConversation {
    userEmail: string;
    lastMessageTime: Time;
    userId: Principal;
    lastMessage: string;
    unreadCount: bigint;
}
export interface MarketInstrument {
    leverage: number;
    name: string;
    bidPrice: number;
    lastUpdated: Time;
    askPrice: number;
    enabled: boolean;
    category: InstrumentCategory;
    spread: number;
    instrumentId: bigint;
    symbol: string;
}
export interface PlatformSettings {
    cryptoHours: string;
    minDeposit: number;
    maintenanceMode: boolean;
    defaultDemoBalance: number;
    maxWithdrawal: number;
    minWithdrawal: number;
    forexHours: string;
    stocksHours: string;
    maxDeposit: number;
}
export interface Transaction {
    status: TransactionStatus;
    transactionType: TransactionType;
    accountId: bigint;
    timestamp: Time;
    amount: number;
    transactionId: bigint;
}
export interface TradeOrder {
    status: OrderStatus;
    closeTime?: Time;
    accountId: bigint;
    openPrice: number;
    takeProfit: number;
    profitLoss?: number;
    orderType: OrderType;
    orderId: bigint;
    closePrice?: number;
    stopLoss: number;
    instrumentId: bigint;
    openTime: Time;
    lotSize: number;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface ChatMessage {
    id: bigint;
    content: string;
    imageData?: Uint8Array;
    audioData?: Uint8Array;
    senderPrincipal: Principal;
    timestamp: Time;
    isFromAdmin: boolean;
    senderEmail: string;
}
export type StripeSessionStatus = {
    __kind__: "completed";
    completed: {
        userPrincipal?: string;
        response: string;
    };
} | {
    __kind__: "failed";
    failed: {
        error: string;
    };
};
export interface StripeConfiguration {
    allowedCountries: Array<string>;
    secretKey: string;
}
export interface TradingAccount {
    balance: number;
    accountId: bigint;
    owner: Principal;
    freeMargin: number;
    accountType: AccountType;
    currency: string;
    margin: number;
    equity: number;
}
export interface CryptoWalletAddress {
    coin: string;
    network: string;
    address: string;
}
export interface CryptoDepositRequest {
    status: CryptoDepositStatus;
    depositId: bigint;
    accountId: bigint;
    owner: Principal;
    coin: string;
    network: string;
    walletAddress: string;
    notes: string;
    timestamp: Time;
    amount: number;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface ShoppingItem {
    productName: string;
    currency: string;
    quantity: bigint;
    priceInCents: bigint;
    productDescription: string;
}
export interface WithdrawalRequest {
    status: WithdrawalRequestStatus;
    requestId: bigint;
    accountId: bigint;
    bankDetails: string;
    owner: Principal;
    notes: string;
    timestamp: Time;
    amount: number;
}
export interface UserProfile {
    created: Time;
    country: string;
    dateOfBirth: string;
    name: string;
    kycNotes?: string;
    email: string;
    kycStatus: KycStatus;
    homeAddress: string;
    accountType: AccountType;
    isBanned: boolean;
    phone: string;
    kycDocumentUrl?: string;
}
export enum AccountType {
    demo = "demo",
    live = "live"
}
export enum CryptoDepositStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum InstrumentCategory {
    forex = "forex",
    stocks = "stocks",
    commodities = "commodities",
    crypto = "crypto",
    indices = "indices"
}
export enum KycStatus {
    notSubmitted = "notSubmitted",
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum OrderStatus {
    closed = "closed",
    cancelled = "cancelled",
    open = "open"
}
export enum OrderType {
    buy = "buy",
    sell = "sell"
}
export enum TransactionStatus {
    pending = "pending",
    completed = "completed",
    failed = "failed"
}
export enum TransactionType {
    deposit = "deposit",
    withdrawal = "withdrawal"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addStaffAdmin(email: string): Promise<void>;
    adminCancelOrder(orderId: bigint): Promise<void>;
    approveCryptoDeposit(depositId: bigint): Promise<void>;
    approveWithdrawalRequest(requestId: bigint, notes: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    banUser(user: Principal): Promise<void>;
    closeOrder(orderId: bigint, closePrice: number): Promise<void>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    createInstrument(name: string, symbol: string, category: InstrumentCategory, bidPrice: number, askPrice: number): Promise<bigint>;
    createOrder(accountId: bigint, instrumentId: bigint, orderType: OrderType, lotSize: number, openPrice: number, stopLoss: number, takeProfit: number): Promise<bigint>;
    createTradingAccount(accountType: AccountType, currency: string): Promise<TradingAccount>;
    deleteUser(user: Principal): Promise<void>;
    depositToDemoAccount(accountId: bigint, amount: number): Promise<void>;
    getAllAccounts(): Promise<Array<TradingAccount>>;
    getAllChatConversations(): Promise<Array<ChatConversation>>;
    getAllInstruments(): Promise<Array<MarketInstrument>>;
    getAllOrders(): Promise<Array<TradeOrder>>;
    getAllTransactions(): Promise<Array<Transaction>>;
    getAllUsers(): Promise<Array<[Principal, UserProfile]>>;
    getAllWithdrawalRequests(): Promise<Array<WithdrawalRequest>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCryptoDepositRequests(): Promise<Array<CryptoDepositRequest>>;
    getCryptoWalletAddresses(): Promise<Array<CryptoWalletAddress>>;
    getEnabledInstruments(): Promise<Array<MarketInstrument>>;
    getFinancialSummary(): Promise<{
        revenue: number;
        totalWithdrawals: number;
        totalBalance: number;
        totalDeposits: number;
    }>;
    getFullLeaderboard(): Promise<Array<LeaderboardEntry>>;
    getInstrumentByIdQuery(instrumentId: bigint): Promise<MarketInstrument | null>;
    getInstrumentBySymbol(symbol: string): Promise<MarketInstrument | null>;
    getOwnAccounts(): Promise<Array<TradingAccount>>;
    getOwnChatMessages(): Promise<Array<ChatMessage>>;
    getOwnNotifications(): Promise<Array<AppNotification>>;
    getOwnCryptoDepositRequests(): Promise<Array<CryptoDepositRequest>>;
    getOwnLeaderboardEntry(): Promise<LeaderboardEntry | null>;
    getOwnOrders(): Promise<Array<TradeOrder>>;
    getOwnTransactions(): Promise<Array<Transaction>>;
    getPlatformSettings(): Promise<PlatformSettings>;
    getStaffAdmins(): Promise<Array<string>>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getTopNLeaderboardEntries(n: bigint): Promise<Array<LeaderboardEntry>>;
    getUserAccounts(user: Principal): Promise<Array<TradingAccount>>;
    getUserChatMessages(userId: Principal): Promise<Array<ChatMessage>>;
    getUserOrders(user: Principal): Promise<Array<TradeOrder>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isStaffAdmin(email: string): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    markConversationRead(userId: Principal): Promise<void>;
    markNotificationsRead(): Promise<void>;
    registerUser(name: string, email: string, phone: string, dateOfBirth: string, country: string, homeAddress: string, accountType: AccountType): Promise<void>;
    rejectCryptoDeposit(depositId: bigint, notes: string): Promise<void>;
    rejectWithdrawalRequest(requestId: bigint, notes: string): Promise<void>;
    removeCryptoWalletAddress(coin: string, network: string): Promise<void>;
    removeStaffAdmin(email: string): Promise<void>;
    requestOtp(email: string): Promise<void>;
    requestStaffOtp(email: string): Promise<void>;
    resetUserDemoBalance(user: Principal, accountId: bigint): Promise<void>;
    reviewKycDocument(user: Principal, status: KycStatus, notes: string): Promise<void>;
    saveCallerUserProfile(name: string, email: string, phone: string, dateOfBirth: string, country: string, homeAddress: string, accountType: AccountType): Promise<void>;
    sendAdminReply(userId: Principal, content: string, imageData: Uint8Array | null, audioData: Uint8Array | null): Promise<bigint>;
    sendAnnouncementToAll(subject: string, body: string): Promise<void>;
    sendAnnouncementToUser(toEmail: string, subject: string, body: string): Promise<void>;
    sendChatMessage(content: string, imageData: Uint8Array | null, audioData: Uint8Array | null): Promise<bigint>;
    setCryptoWalletAddress(coin: string, network: string, address: string): Promise<void>;
    setPlatformSettings(settings: PlatformSettings): Promise<void>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    submitCryptoDepositRequest(accountId: bigint, coin: string, network: string, amount: number, walletAddress: string): Promise<bigint>;
    submitKycDocument(documentUrl: string, _documentType: string): Promise<void>;
    submitWithdrawalRequest(accountId: bigint, amount: number, bankDetails: string): Promise<bigint>;
    toggleInstrumentEnabled(instrumentId: bigint, enabled: boolean): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    unbanUser(user: Principal): Promise<void>;
    updateAccountBalance(accountId: bigint, newBalance: number): Promise<void>;
    updateInstrumentLeverage(instrumentId: bigint, leverage: number): Promise<void>;
    updateInstrumentPrices(instrumentId: string, bidPrice: number, askPrice: number): Promise<void>;
    updateUserProfile(name: string, email: string, phone: string, dateOfBirth: string, country: string, homeAddress: string): Promise<void>;
    upgradeUserAccountType(user: Principal, accountType: AccountType): Promise<void>;
    verifyOtp(email: string, code: string): Promise<boolean>;
    verifyStaffOtp(email: string, code: string): Promise<boolean>;
}
