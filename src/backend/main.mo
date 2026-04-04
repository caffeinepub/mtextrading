import Int "mo:core/Int";
import Time "mo:core/Time";
import Principal "mo:core/Principal";

import Map "mo:core/Map";
import List "mo:core/List";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import Order "mo:core/Order";
import Iter "mo:core/Iter";
import Nat "mo:core/Nat";
import Float "mo:core/Float";

import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import AccessControl "authorization/access-control";
import Stripe "stripe/stripe";
import OutCall "http-outcalls/outcall";
import _Storage "blob-storage/Storage";
import EmailClient "email/emailClient";

// Apply migration via with clause from Migration submodule

actor {
  // Enumeration Types
  public type AccountType = { #demo; #live };
  public type InstrumentCategory = { #forex; #stocks; #crypto; #commodities; #indices };
  public type OrderType = { #buy; #sell };
  public type OrderStatus = { #open; #closed; #cancelled };
  public type TransactionType = { #deposit; #withdrawal };
  public type TransactionStatus = { #pending; #completed; #failed };
  public type KycStatus = { #notSubmitted; #pending; #approved; #rejected };
  public type WithdrawalRequestStatus = { #pending; #approved; #rejected };
  public type CryptoDepositStatus = { #pending; #approved; #rejected };

  public type PlatformSettings = {
    maintenanceMode : Bool;
    minDeposit : Float;
    maxDeposit : Float;
    minWithdrawal : Float;
    maxWithdrawal : Float;
    forexHours : Text;
    stocksHours : Text;
    cryptoHours : Text;
    defaultDemoBalance : Float;
  };
  public type BotConfig = {
    botName : Text;
    greetingMessage : Text;
    rules : Text;
    voiceEnabled : Bool;
    findProviderEnabled : Bool;
    depositFlowEnabled : Bool;
    tradeFlowEnabled : Bool;
    supportFlowEnabled : Bool;
  };



  // Record Types
  public type UserProfile = {
    name : Text;
    email : Text;
    phone : Text;
    dateOfBirth : Text;
    country : Text;
    homeAddress : Text;
    accountType : AccountType;
    created : Time.Time;
    isBanned : Bool;
    kycStatus : KycStatus;
    kycDocumentUrl : ?Text;
    kycNotes : ?Text;
  };

  type TradingAccount = {
    accountId : Nat;
    accountCode : Text;
    owner : Principal;
    accountType : AccountType;
    currency : Text;
    balance : Float;
    equity : Float;
    margin : Float;
    freeMargin : Float;
  };

  type MarketInstrument = {
    instrumentId : Nat;
    name : Text;
    symbol : Text;
    category : InstrumentCategory;
    bidPrice : Float;
    askPrice : Float;
    spread : Float;
    lastUpdated : Time.Time;
    enabled : Bool;
    leverage : Float;
  };

  type TradeOrder = {
    orderId : Nat;
    accountId : Nat;
    instrumentId : Nat;
    orderType : OrderType;
    lotSize : Float;
    openPrice : Float;
    closePrice : ?Float;
    stopLoss : Float;
    takeProfit : Float;
    openTime : Time.Time;
    closeTime : ?Time.Time;
    status : OrderStatus;
    profitLoss : ?Float;
  };

  type Transaction = {
    transactionId : Nat;
    accountId : Nat;
    transactionType : TransactionType;
    amount : Float;
    timestamp : Time.Time;
    status : TransactionStatus;
  };

  public type WithdrawalRequest = {
    requestId : Nat;
    accountId : Nat;
    owner : Principal;
    amount : Float;
    bankDetails : Text;
    status : WithdrawalRequestStatus;
    timestamp : Time.Time;
    notes : Text;
  };

  public type CryptoDepositRequest = {
    depositId : Nat;
    accountId : Nat;
    owner : Principal;
    coin : Text;
    network : Text;
    amount : Float;
    walletAddress : Text;
    status : CryptoDepositStatus;
    timestamp : Time.Time;
    notes : Text;
  };

  public type CryptoWalletAddress = {
    coin : Text;
    network : Text;
    address : Text;
  };

  public type ChatMessage = {
    id : Nat;
    senderPrincipal : Principal;
    senderEmail : Text;
    content : Text;
    imageData : ?Blob;
    audioData : ?Blob;
    timestamp : Time.Time;
    isFromAdmin : Bool;
  };

  public type ChatConversation = {
    userId : Principal;
    userEmail : Text;
    lastMessage : Text;
    lastMessageTime : Time.Time;
    unreadCount : Nat;
  };

  public type AppNotification = {
    id : Nat;
    title : Text;
    body : Text;
    timestamp : Time.Time;
    isRead : Bool;
    notifType : Text;
    owner : Principal;
  };

  // Leaderboard Entry
  type LeaderboardEntry = {
    principal : ?Principal;
    name : Text;
    profit : Float;
  };

  module LeaderboardEntry {
    public func compare(x : LeaderboardEntry, y : LeaderboardEntry) : Order.Order {
      Float.compare(y.profit, x.profit);
    };
  };

  // Persistent State
  let userProfiles = Map.empty<Principal, UserProfile>();
  let tradingAccounts = Map.empty<Nat, TradingAccount>();
  let instruments = Map.empty<Text, MarketInstrument>();
  let orders = Map.empty<Nat, TradeOrder>();
  let transactions = Map.empty<Nat, Transaction>();
  let withdrawalRequests = Map.empty<Nat, WithdrawalRequest>();
  let otpStore = Map.empty<Text, { code : Text; expiry : Time.Time }>();
  let staffAdmins = Map.empty<Text, Bool>();
  let staffOtpStore = Map.empty<Text, { code : Text; expiry : Time.Time }>();
  let cryptoWalletAddresses = Map.empty<Text, CryptoWalletAddress>();
  let cryptoDepositRequests = Map.empty<Nat, CryptoDepositRequest>();
  let passwordHashes = Map.empty<Text, Text>(); // email -> sha256 hex hash
  let verifiedEmails = Map.empty<Text, Bool>(); // email -> verified
  let emailVerificationTokens = Map.empty<Text, { email : Text; expiry : Time.Time }>(); // token -> {email, expiry}
  let passwordResetTokens = Map.empty<Text, { email : Text; expiry : Time.Time }>(); // token -> {email, expiry}

  var nextAccountId = 1;
  var nextWithdrawalRequestId = 1;
  var nextOrderId = 1;
  var nextTransactionId = 1;
  var nextCryptoDepositId = 1;

  let chatMessages = Map.empty<Nat, ChatMessage>();
  var nextChatMessageId = 1;
  let chatReadStatus = Map.empty<Principal, Time.Time>();
  let notifications = Map.empty<Nat, AppNotification>();
  var nextNotificationId = 1;

  // Retained for upgrade compatibility (previously used for Stripe)
  var stripeConfiguration : ?Stripe.StripeConfiguration = null;

  var platformSettings : PlatformSettings = {
    maintenanceMode = false;
    minDeposit = 10.0;
    maxDeposit = 100000.0;
    minWithdrawal = 10.0;
    maxWithdrawal = 50000.0;
    forexHours = "24/5";
    stocksHours = "24/5";
    cryptoHours = "24/7";
    defaultDemoBalance = 100000.0;
  };
  var botConfig : BotConfig = {
    botName = "Mtex AI Assistant";
    greetingMessage = "Hi! I'm Mtex AI, your trading assistant. Ask me anything about the platform — how to deposit, how to trade, or how to find your way around!";
    rules = "";
    voiceEnabled = true;
    findProviderEnabled = true;
    depositFlowEnabled = true;
    tradeFlowEnabled = true;
    supportFlowEnabled = true;
  };



  // Initialize default staff admin
  staffAdmins.add("mtextradingsupport@gmail.com", true);

  // Include prefabricated authorization and blob-storage components
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  // ============================================
  // User Profile Management
  // ============================================

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    verifyUserNotBanned(caller);
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    if (caller == user) {
      verifyUserNotBanned(caller);
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(name : Text, email : Text, phone : Text, dateOfBirth : Text, country : Text, homeAddress : Text, accountType : AccountType) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    verifyUserNotBanned(caller);

    // Get existing profile to preserve admin-controlled fields
    let existingProfile = userProfiles.get(caller);

    let profile : UserProfile = switch (existingProfile) {
      case (null) {
        // New profile - set safe defaults for admin-controlled fields
        {
          name = name;
          email = email;
          phone = phone;
          dateOfBirth = dateOfBirth;
          country = country;
          homeAddress = homeAddress;
          accountType = accountType;
          created = Time.now();
          isBanned = false;
          kycStatus = #notSubmitted;
          kycDocumentUrl = null;
          kycNotes = null;
        };
      };
      case (?existing) {
        // Update existing profile - preserve admin-controlled fields
        {
          name = name;
          email = email;
          phone = phone;
          dateOfBirth = dateOfBirth;
          country = country;
          homeAddress = homeAddress;
          accountType = accountType;
          created = existing.created;
          isBanned = existing.isBanned; // Preserve ban status
          kycStatus = existing.kycStatus; // Preserve KYC status
          kycDocumentUrl = existing.kycDocumentUrl;
          kycNotes = existing.kycNotes;
        };
      };
    };

    userProfiles.add(caller, profile);
    addNotificationForUser(caller, "Profile Complete!", "Congratulations! Your profile is set up. Make your first deposit and start trading today.", "profile_complete");
    // Auto-create demo account if user has none
    let existingDemoAccts = tradingAccounts.values().toArray().filter(
      func(a) {
        a.owner == caller and a.accountType == #demo
      }
    );
    if (existingDemoAccts.size() == 0) {
      // Create new demo account
      let accountCode = "DEMO-0000001";
      let demoAcc : TradingAccount = {
        accountId = nextAccountId;
        accountCode;
        owner = caller;
        accountType = #demo;
        currency = "USD";
        balance = 100000.0;
        equity = 100000.0;
        margin = 0.0;
        freeMargin = 100000.0;
      };
      tradingAccounts.add(nextAccountId, demoAcc);
      nextAccountId += 1;
    };
  };

  public shared ({ caller }) func updateUserProfile(name : Text, email : Text, phone : Text, dateOfBirth : Text, country : Text, homeAddress : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update profiles");
    };
    verifyUserNotBanned(caller);

    let existingProfile = switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("Profile not found. Please register first.") };
      case (?p) { p };
    };

    // Update only user-editable fields, preserve admin-controlled fields
    let updatedProfile : UserProfile = {
      name = name;
      email = email;
      phone = phone;
      dateOfBirth = dateOfBirth;
      country = country;
      homeAddress = homeAddress;
      accountType = existingProfile.accountType;
      created = existingProfile.created;
      isBanned = existingProfile.isBanned;
      kycStatus = existingProfile.kycStatus;
      kycDocumentUrl = existingProfile.kycDocumentUrl;
      kycNotes = existingProfile.kycNotes;
    };

    userProfiles.add(caller, updatedProfile);
  };

  // Helper function to pad with zeros - moves trailing numbers to leading for account code formatting.
  func padZeros(text : Text, totalLength : Nat) : Text {
    let digits = text.size();
    var pad = "";
    var i = digits;
    while (i < totalLength) { pad := pad # "0"; i += 1 };
    pad # text;
  };

  // ======================
  // Account Management
  // ======================

  // Create demo account for caller.
  public shared ({ caller }) func createDemoAccount() : async TradingAccount {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can request demo accounts");
    };
    verifyUserNotBanned(caller);
    // Count caller's existing demo accounts
    let demoAccounts = tradingAccounts.values().toArray().filter(
      func(a) { a.accountType == #demo and a.owner == caller }
    );
    let numDemoAccounts = demoAccounts.size();
    if (numDemoAccounts >= 3) { Runtime.trap("Maximum 3 demo accounts per user") };
    // Compose new account code
    let accountNumber = numDemoAccounts + 1;
    let accountCode = "DEMO-" # padZeros(accountNumber.toText(), 7);
    // Create account
    let account : TradingAccount = {
      accountId = nextAccountId;
      accountCode;
      owner = caller;
      accountType = #demo;
      currency = "USD";
      balance = 100000.0;
      equity = 100000.0;
      margin = 0.0;
      freeMargin = 100000.0;
    };
    // Add to database and increment next id
    tradingAccounts.add(nextAccountId, account);
    nextAccountId += 1;
    account;
  };

  // Create live account placeholder for caller
  public shared ({ caller }) func createLiveAccountPlaceholder(currency : Text) : async TradingAccount {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can request live accounts");
    };
    verifyUserNotBanned(caller);
    // Count caller's existing live accounts
    let liveAccounts = tradingAccounts.values().toArray().filter(
      func(a) { a.accountType == #live and a.owner == caller }
    );
    let numLiveAccounts = liveAccounts.size();
    if (numLiveAccounts >= 3) { Runtime.trap("Maximum 3 live accounts per user") };
    // Compose new live account code
    let accountNumber = numLiveAccounts + 1;
    let accountCode = "LIVE-" # padZeros(accountNumber.toText(), 7);
    // Create account
    let account : TradingAccount = {
      accountId = nextAccountId;
      accountCode;
      owner = caller;
      accountType = #live;
      currency;
      balance = 0.0;
      equity = 0.0;
      margin = 0.0;
      freeMargin = 0.0;
    };
    // Add to database and increment next id
    tradingAccounts.add(nextAccountId, account);
    nextAccountId += 1;
    account;
  };

  // Create trading account for caller.
  public shared ({ caller }) func createTradingAccount(accountType : AccountType, currency : Text) : async TradingAccount {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create trading accounts");
    };
    verifyUserNotBanned(caller);
    let callerTypeAccounts = tradingAccounts.values().toArray().filter(
      func(a) { a.accountType == accountType and a.owner == caller }
    );
    let accountNumber = callerTypeAccounts.size() + 1;
    let baseCode = switch (accountType) {
      case (#demo) { "DEMO-" };
      case (#live) { "LIVE-" };
    };
    let accountCode = baseCode # padZeros(accountNumber.toText(), 7);
    let startingBalance = switch (accountType) {
      case (#demo) { 100000.0 };
      case (#live) { 0.0 };
    };
    let account : TradingAccount = {
      accountId = nextAccountId;
      accountCode;
      owner = caller;
      accountType;
      currency;
      balance = startingBalance;
      equity = startingBalance;
      margin = 0.0;
      freeMargin = startingBalance;
    };
    tradingAccounts.add(nextAccountId, account);
    nextAccountId += 1;
    account;
  };

  // ======================
  // Platform Admin Functions
  // ======================
  public query ({ caller }) func getPlatformSettings() : async PlatformSettings {
    verifyAdminAccess(caller);
    platformSettings;
  };

  public shared ({ caller }) func setPlatformSettings(settings : PlatformSettings) : async () {
    verifyAdminAccess(caller);
    platformSettings := settings;
  };

  public shared ({ caller }) func toggleInstrumentEnabled(instrumentId : Nat, enabled : Bool) : async () {
    verifyAdminAccess(caller);
    let instrument = getInstrumentById(instrumentId);
    let updatedInstrument = { instrument with enabled };
    instruments.add(updatedInstrument.symbol, updatedInstrument);
  };

  public shared ({ caller }) func updateInstrumentLeverage(instrumentId : Nat, leverage : Float) : async () {
    verifyAdminAccess(caller);
    if (leverage <= 0 or leverage > 100.0) {
      Runtime.trap("Leverage must be between 1 and 100");
    };
    let instrument = getInstrumentById(instrumentId);
    let updatedInstrument = { instrument with leverage };
    instruments.add(instrument.symbol, updatedInstrument);
  };

  public shared ({ caller }) func resetUserDemoBalance(user : Principal, accountId : Nat) : async () {
    verifyAdminAccess(caller);
    let account = getAndVerifyAccountOwnership(accountId, user);
    assertCondition(account.accountType == #demo, "Can only reset demo accounts");
    let updatedAccount = { account with balance = platformSettings.defaultDemoBalance };
    tradingAccounts.add(accountId, updatedAccount);
  };

  public shared ({ caller }) func sendAnnouncementToAll(subject : Text, body : Text) : async () {
    verifyAdminAccess(caller);
    let emails = userProfiles.values().toArray().map(func(profile) { profile.email });
    if (emails.size() == 0) { Runtime.trap("No users found") };
    let result = await EmailClient.sendRawEmail(
      "no-reply",
      emails,
      [],
      [],
      subject,
      body,
    );
    switch (result) {
      case (#ok) {};
      case (#err(error)) { Runtime.trap("Failed to send announcement: " # error) };
    };
  };

  public shared ({ caller }) func sendAnnouncementToUser(toEmail : Text, subject : Text, body : Text) : async () {
    verifyAdminAccess(caller);
    let result = await EmailClient.sendRawEmail(
      "no-reply",
      [toEmail],
      [],
      [],
      subject,
      body,
    );
    switch (result) {
      case (#ok) {};
      case (#err(error)) { Runtime.trap("Failed to send announcement: " # error) };
    };
  };

  // ============================================
  // Staff Admin Management (Superadmin only)
  // ============================================

  public query ({ caller }) func getStaffAdmins() : async [Text] {
    verifySuperAdminAccess(caller);
    let emails = List.empty<Text>();
    for ((email, active) in staffAdmins.entries()) {
      if (active) { emails.add(email) };
    };
    emails.toArray();
  };

  public shared ({ caller }) func addStaffAdmin(email : Text) : async () {
    verifySuperAdminAccess(caller);
    staffAdmins.add(email, true);
  };

  public shared ({ caller }) func removeStaffAdmin(email : Text) : async () {
    verifySuperAdminAccess(caller);
    staffAdmins.add(email, false);
  };

  // ============================================
  // Staff Admin OTP Login
  // ============================================

  public func requestStaffOtp(email : Text) : async { #ok; #err : Text } {
    // Verify email is authorized staff admin
    let isAuthorized = switch (staffAdmins.get(email)) {
      case (null) { false };
      case (?active) { active };
    };
    if (not isAuthorized) {
      return #err("not authorized as staff admin");
    };

    let now = Time.now();
    let raw = (now / 1_000) % 1_000_000;
    let rawNat = Int.abs(raw);
    let s = rawNat.toText();
    let len = s.size();
    var pad = "";
    var i = len;
    while (i < 6) { pad := pad # "0"; i += 1 };
    let code = pad # s;
    let expiry = now + 600_000_000_000;
    let sendResult = try {
      await EmailClient.sendRawEmail(
        "no-reply",
        [email],
        [],
        [],
        "Your Mtextrading Admin verification code",
        "Your admin verification code is: " # code # "\n\nThis code expires in 10 minutes. Do not share it with anyone.",
      )
    } catch (e) {
      #err(e.message())
    };
    switch (sendResult) {
      case (#ok) {
        staffOtpStore.add(email, { code = code; expiry = expiry });
        #ok;
      };
      case (#err(error)) {
        #err("Email service error: " # error);
      };
    };
  };

  public shared ({ caller }) func verifyStaffOtp(email : Text, code : Text) : async Bool {
    let now = Time.now();
    switch (staffOtpStore.get(email)) {
      case null { false };
      case (?entry) {
        if (entry.expiry < now) { false }
        else if (entry.code != code) { false }
        else {
          // Grant caller admin role so they can use the admin dashboard
          accessControlState.userRoles.add(caller, #admin);
          true
        };
      };
    };
  };

  public query func isStaffAdmin(email : Text) : async Bool {
    switch (staffAdmins.get(email)) {
      case (null) { false };
      case (?active) { active };
    };
  };

  // ============================================
  // Crypto Wallet Addresses
  // ============================================

  public query func getCryptoWalletAddresses() : async [CryptoWalletAddress] {
    cryptoWalletAddresses.values().toArray();
  };

  public shared ({ caller }) func setCryptoWalletAddress(coin : Text, network : Text, address : Text) : async () {
    verifyAdminAccess(caller);
    let key = coin # "_" # network;
    cryptoWalletAddresses.add(key, { coin; network; address });
  };

  public shared ({ caller }) func removeCryptoWalletAddress(coin : Text, network : Text) : async () {
    verifyAdminAccess(caller);
    let key = coin # "_" # network;
    cryptoWalletAddresses.remove(key);
  };

  // ============================================
  // Crypto Deposit Requests
  // ============================================

  public shared ({ caller }) func submitCryptoDepositRequest(accountId : Nat, coin : Text, network : Text, amount : Float, walletAddress : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can submit deposit requests");
    };
    verifyUserNotBanned(caller);
    let _account = getAndVerifyAccountOwnership(accountId, caller);
    let req : CryptoDepositRequest = {
      depositId = nextCryptoDepositId;
      accountId;
      owner = caller;
      coin;
      network;
      amount;
      walletAddress;
      status = #pending;
      timestamp = Time.now();
      notes = "";
    };
    cryptoDepositRequests.add(nextCryptoDepositId, req);
    nextCryptoDepositId += 1;
    req.depositId;
  };

  public query ({ caller }) func getCryptoDepositRequests() : async [CryptoDepositRequest] {
    verifyAdminAccess(caller);
    cryptoDepositRequests.values().toArray();
  };

  public query ({ caller }) func getOwnCryptoDepositRequests() : async [CryptoDepositRequest] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their deposit requests");
    };
    verifyUserNotBanned(caller);
    cryptoDepositRequests.values().toArray().filter(func(r) { r.owner == caller });
  };

  public shared ({ caller }) func approveCryptoDeposit(depositId : Nat) : async () {
    verifyAdminAccess(caller);
    let req = switch (cryptoDepositRequests.get(depositId)) {
      case (null) { Runtime.trap("Deposit request not found") };
      case (?r) { r };
    };
    if (req.status != #pending) {
      Runtime.trap("Deposit is not pending");
    };
    let currentTime = Time.now();
    let updated = { req with status = #approved; notes = "Approved by admin" };
    cryptoDepositRequests.add(depositId, updated);
    let transaction : Transaction = {
      transactionId = nextTransactionId;
      accountId = req.accountId;
      transactionType = #deposit;
      amount = req.amount;
      timestamp = currentTime;
      status = #completed;
    };
    transactions.add(nextTransactionId, transaction);
    nextTransactionId += 1;
    // Auto-create or credit live account on approved deposit
    let existingLiveAccts = tradingAccounts.values().toArray().filter(
      func(a) { a.owner == req.owner and a.accountType == #live }
    );
    if (existingLiveAccts.size() == 0) {
      let liveCode = "LIVE-0000001";
      let newLive : TradingAccount = {
        accountId = nextAccountId;
        accountCode = liveCode;
        owner = req.owner;
        accountType = #live;
        currency = "USD";
        balance = req.amount;
        equity = req.amount;
        margin = 0.0;
        freeMargin = req.amount;
      };
      tradingAccounts.add(nextAccountId, newLive);
      nextAccountId += 1;
    } else {
      let liveAcc = existingLiveAccts[0];
      let updatedLive = { liveAcc with balance = liveAcc.balance + req.amount; equity = liveAcc.equity + req.amount; freeMargin = liveAcc.freeMargin + req.amount };
      tradingAccounts.add(liveAcc.accountId, updatedLive);
    };
    // Notify the user their deposit was approved
    let amountInt = req.amount.toInt();
    let amountStr = "$" # amountInt.toText();
    addNotificationForUser(req.owner, "Deposit Approved!", "Your deposit of " # amountStr # " has been approved. Your account balance has been updated.", "deposit_approved");
    // Send email notification
    let userEmail = switch (userProfiles.get(req.owner)) {
      case (?p) { p.email };
      case null { "" };
    };
    if (userEmail != "") {
      let _ = await EmailClient.sendRawEmail(
        "no-reply",
        [userEmail],
        [],
        [],
        "Your Mtextrading Account Has Been Funded",
        "Congratulations!\n\nYour Mtextrading account has been successfully funded.\n\nAmount credited: " # amountStr # "\n\nYou are all set to start trading. Head to the Trade tab to place your first position across forex, crypto, stocks, and more.\n\nIf you did not authorize this deposit, please contact our support team immediately.\n\nThe Mtextrading Team"
      );
    };
  };

  public shared ({ caller }) func rejectCryptoDeposit(depositId : Nat, notes : Text) : async () {
    verifyAdminAccess(caller);
    let req = switch (cryptoDepositRequests.get(depositId)) {
      case (null) { Runtime.trap("Deposit request not found") };
      case (?r) { r };
    };
    if (req.status != #pending) {
      Runtime.trap("Deposit is not pending");
    };
    let updated = { req with status = #rejected; notes };
    cryptoDepositRequests.add(depositId, updated);
  };

  // ============================================
  // User OTP for regular auth
  // ============================================

  public func requestOtp(email : Text) : async () {
    let now = Time.now();
    let raw = (now / 1_000) % 1_000_000;
    let rawNat = Int.abs(raw);
    let s = rawNat.toText();
    let len = s.size();
    var pad = "";
    var i = len;
    while (i < 6) { pad := pad # "0"; i += 1 };
    let code = pad # s;
    let expiry = now + 600_000_000_000;
    otpStore.add(email, { code = code; expiry = expiry });
    let result = await EmailClient.sendRawEmail(
      "no-reply",
      [email],
      [],
      [],
      "Your Mtextrading verification code",
      "Your verification code is: " # code # "\n\nThis code expires in 10 minutes. Do not share it with anyone.",
    );
    switch (result) {
      case (#ok) {};
      case (#err(error)) { Runtime.trap("Failed to send OTP: " # error) };
    };
  };

  public query func verifyOtp(email : Text, code : Text) : async Bool {
    let now = Time.now();
    switch (otpStore.get(email)) {
      case null { false };
      case (?entry) {
        if (entry.expiry < now) { false }
        else { entry.code == code }
      };
    };
  };

  // ============================================
  // Public Market Data
  // ============================================

  public query func getAllInstruments() : async [MarketInstrument] {
    instruments.values().toArray();
  };

  public query func getEnabledInstruments() : async [MarketInstrument] {
    instruments.values().toArray().filter(func(i) { i.enabled });
  };

  public query func getInstrumentByIdQuery(instrumentId : Nat) : async ?MarketInstrument {
    instruments.values().toArray().find(func(i) { i.instrumentId == instrumentId });
  };

  public query func getInstrumentBySymbol(symbol : Text) : async ?MarketInstrument {
    instruments.get(symbol);
  };

  // ============================================
  // User Registration
  // ============================================

  public shared ({ caller }) func registerUser(name : Text, email : Text, phone : Text, dateOfBirth : Text, country : Text, homeAddress : Text, accountType : AccountType) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can register");
    };
    switch (userProfiles.get(caller)) {
      case (null) {
        let profile : UserProfile = {
          name = name;
          email = email;
          phone = phone;
          dateOfBirth = dateOfBirth;
          country = country;
          homeAddress = homeAddress;
          accountType = accountType;
          created = Time.now();
          isBanned = false;
          kycStatus = #notSubmitted;
          kycDocumentUrl = null;
          kycNotes = null;
        };
        userProfiles.add(caller, profile);
        addNotificationForUser(caller, "Welcome to Mtextrading!", "Your account has been created. Complete your profile to start trading.", "welcome");
      };
      case (?_) { Runtime.trap("User already registered") };
    };
  };

  // ============================================
  // Trader Functions
  // ============================================

  public query ({ caller }) func getOwnAccounts() : async [TradingAccount] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view accounts");
    };
    verifyUserNotBanned(caller);
    tradingAccounts.values().toArray().filter(
      func(account) { account.owner == caller }
    );
  };

  public query ({ caller }) func getOwnOrders() : async [TradeOrder] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view orders");
    };
    verifyUserNotBanned(caller);
    let ownAccountIds = tradingAccounts.values().toArray().filter(
      func(account) { account.owner == caller }
    ).map(func(account) { account.accountId });
    orders.values().toArray().filter(func(order) { ownAccountIds.values().contains(order.accountId) });
  };

  public query ({ caller }) func getOwnTransactions() : async [Transaction] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view transactions");
    };
    verifyUserNotBanned(caller);
    let ownAccountIds = tradingAccounts.values().toArray().filter(
      func(account) { account.owner == caller }
    ).map(func(account) { account.accountId });
    transactions.values().toArray().filter(func(tx) { ownAccountIds.values().contains(tx.accountId) });
  };

  public shared ({ caller }) func createOrder(accountId : Nat, instrumentId : Nat, orderType : OrderType, lotSize : Float, openPrice : Float, stopLoss : Float, takeProfit : Float) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create orders");
    };
    verifyUserNotBanned(caller);
    let account = getAndVerifyAccountOwnership(accountId, caller);
    let instrument = getInstrumentById(instrumentId);
    if (not instrument.enabled) {
      Runtime.trap("Instrument is currently disabled, trading not allowed");
    };
    let order : TradeOrder = {
      orderId = nextOrderId;
      accountId = account.accountId;
      instrumentId;
      orderType;
      lotSize;
      openPrice;
      closePrice = null;
      stopLoss;
      takeProfit;
      openTime = Time.now();
      closeTime = null;
      status = #open;
      profitLoss = null;
    };
    orders.add(nextOrderId, order);
    nextOrderId += 1;
    order.orderId;
  };

  public shared ({ caller }) func closeOrder(orderId : Nat, closePrice : Float) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can close orders");
    };
    verifyUserNotBanned(caller);
    let order = switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?o) { o };
    };
    let account = switch (tradingAccounts.get(order.accountId)) {
      case (null) { Runtime.trap("Account not found") };
      case (?acc) { acc };
    };
    assertAccountOwnership(account, caller);
    assertOrderOpen(order);
    let profitLoss = switch (order.orderType) {
      case (#buy) { (closePrice - order.openPrice) * order.lotSize };
      case (#sell) { (order.openPrice - closePrice) * order.lotSize };
    };
    let updatedOrder = {
      order with
      closePrice = ?closePrice;
      closeTime = ?Time.now();
      status = #closed;
      profitLoss = ?profitLoss;
    };
    orders.add(orderId, updatedOrder);
    let updatedAccount = { account with balance = account.balance + profitLoss };
    tradingAccounts.add(account.accountId, updatedAccount);
  };

  public shared ({ caller }) func depositToDemoAccount(accountId : Nat, amount : Float) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can deposit");
    };
    verifyUserNotBanned(caller);
    let account = getAndVerifyAccountOwnership(accountId, caller);
    if (account.accountType != #demo) {
      Runtime.trap("Can only deposit to demo accounts");
    };
    let updatedAccount = { account with balance = account.balance + amount };
    tradingAccounts.add(accountId, updatedAccount);
    let transaction : Transaction = {
      transactionId = nextTransactionId;
      accountId;
      transactionType = #deposit;
      amount;
      timestamp = Time.now();
      status = #completed;
    };
    transactions.add(nextTransactionId, transaction);
    nextTransactionId += 1;
  };

  public shared ({ caller }) func submitKycDocument(documentUrl : Text, _documentType : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can submit KYC");
    };
    verifyUserNotBanned(caller);
    switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("User not found") };
      case (?profile) {
        let updatedProfile = {
          profile with
          kycStatus = #pending;
          kycDocumentUrl = ?documentUrl;
        };
        userProfiles.add(caller, updatedProfile);
      };
    };
  };

  // ============================================
  // Admin Functions
  // ============================================

  public query ({ caller }) func getAllUsers() : async [(Principal, UserProfile)] {
    verifyAdminAccess(caller);
    userProfiles.entries().toArray();
  };

  // Returns all emails that have verified registration (even if profile not yet completed)
  public query ({ caller }) func getEmailRegistrations() : async [Text] {
    verifyAdminAccess(caller);
    verifiedEmails.entries().toArray()
      .filter(func(e : (Text, Bool)) : Bool { e.1 })
      .map(func(e : (Text, Bool)) : Text { e.0 });
  };

  public query ({ caller }) func getAllAccounts() : async [TradingAccount] {
    verifyAdminAccess(caller);
    tradingAccounts.values().toArray();
  };

  public query ({ caller }) func getAllOrders() : async [TradeOrder] {
    verifyAdminAccess(caller);
    orders.values().toArray();
  };

  public query ({ caller }) func getAllTransactions() : async [Transaction] {
    verifyAdminAccess(caller);
    transactions.values().toArray();
  };

  public shared ({ caller }) func updateInstrumentPrices(instrumentId : Text, bidPrice : Float, askPrice : Float) : async () {
    verifyAdminAccess(caller);
    let instrument = switch (instruments.get(instrumentId)) {
      case (null) { Runtime.trap("Instrument not found") };
      case (?i) { i };
    };
    let updatedInstrument = {
      instrument with
      bidPrice;
      askPrice;
      spread = askPrice - bidPrice;
      lastUpdated = Time.now();
    };
    instruments.add(instrumentId, updatedInstrument);
  };

  public shared ({ caller }) func createInstrument(name : Text, symbol : Text, category : InstrumentCategory, bidPrice : Float, askPrice : Float) : async Nat {
    verifyAdminAccess(caller);
    let instrumentId = instruments.size();
    let instrument : MarketInstrument = {
      instrumentId;
      name;
      symbol;
      category;
      bidPrice;
      askPrice;
      spread = askPrice - bidPrice;
      lastUpdated = Time.now();
      enabled = true;
      leverage = 100.0;
    };
    instruments.add(symbol, instrument);
    instrumentId;
  };

  // Any authenticated user can call this to ensure an instrument exists before placing an order
  public shared ({ caller }) func getOrCreateInstrument(name : Text, symbol : Text, category : InstrumentCategory, bidPrice : Float, askPrice : Float) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can call getOrCreateInstrument");
    };
    switch (instruments.get(symbol)) {
      case (?existing) { existing.instrumentId };
      case null {
        let instrumentId = instruments.size();
        let instrument : MarketInstrument = {
          instrumentId;
          name;
          symbol;
          category;
          bidPrice;
          askPrice;
          spread = askPrice - bidPrice;
          lastUpdated = Time.now();
          enabled = true;
          leverage = 100.0;
        };
        instruments.add(symbol, instrument);
        instrumentId;
      };
    };
  };


  public shared ({ caller }) func deleteUser(user : Principal) : async () {
    verifyAdminAccess(caller);
    userProfiles.remove(user);
  };

  public shared ({ caller }) func updateAccountBalance(accountId : Nat, newBalance : Float) : async () {
    verifyAdminAccess(caller);
    let account = switch (tradingAccounts.get(accountId)) {
      case (null) { Runtime.trap("Account not found") };
      case (?acc) { acc };
    };
    let updatedAccount = { account with balance = newBalance };
    tradingAccounts.add(accountId, updatedAccount);
  };

  public shared ({ caller }) func banUser(user : Principal) : async () {
    verifyAdminAccess(caller);
    switch (userProfiles.get(user)) {
      case (null) { Runtime.trap("User not found") };
      case (?profile) {
        userProfiles.add(user, { profile with isBanned = true });
      };
    };
  };

  public shared ({ caller }) func unbanUser(user : Principal) : async () {
    verifyAdminAccess(caller);
    switch (userProfiles.get(user)) {
      case (null) { Runtime.trap("User not found") };
      case (?profile) {
        userProfiles.add(user, { profile with isBanned = false });
      };
    };
  };

  public shared ({ caller }) func upgradeUserAccountType(user : Principal, accountType : AccountType) : async () {
    verifyAdminAccess(caller);
    switch (userProfiles.get(user)) {
      case (null) { Runtime.trap("User not found") };
      case (?profile) {
        userProfiles.add(user, { profile with accountType });
      };
    };
  };

  public shared ({ caller }) func adminCancelOrder(orderId : Nat) : async () {
    verifyAdminAccess(caller);
    let order = switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) { order };
    };
    orders.add(orderId, { order with status = #cancelled });
  };

  public shared ({ caller }) func reviewKycDocument(user : Principal, status : KycStatus, notes : Text) : async () {
    verifyAdminAccess(caller);
    switch (userProfiles.get(user)) {
      case (null) { Runtime.trap("User not found") };
      case (?profile) {
        userProfiles.add(user, { profile with kycStatus = status; kycNotes = ?notes });
      };
    };
  };

  public query ({ caller }) func getUserOrders(user : Principal) : async [TradeOrder] {
    verifyAdminAccess(caller);
    let userAccounts = tradingAccounts.values().toArray().filter(func(account) { account.owner == user });
    if (userAccounts.size() == 0) { return [] };
    let userAccountIds = userAccounts.map(func(account) { account.accountId });
    orders.values().toArray().filter(func(order) { userAccountIds.values().contains(order.accountId) });
  };

  public query ({ caller }) func getUserAccounts(user : Principal) : async [TradingAccount] {
    verifyAdminAccess(caller);
    tradingAccounts.values().toArray().filter(func(account) { account.owner == user });
  };

  // ============================================
  // Leaderboard
  // ============================================

  func getSortedLeaderboardEntries() : [LeaderboardEntry] {
    let entries = List.empty<LeaderboardEntry>();
    for ((principal, profile) in userProfiles.entries()) {
      let profit = tradingAccounts.values().toArray().filter(func(account) { account.owner == principal }).foldLeft(0.0, func(acc, account) { acc + account.balance });
      entries.add({ principal = ?principal; name = profile.name; profit });
    };
    entries.toArray().sort();
  };

  public query func getFullLeaderboard() : async [LeaderboardEntry] {
    getSortedLeaderboardEntries();
  };

  public query func getTopNLeaderboardEntries(n : Nat) : async [LeaderboardEntry] {
    let sortedEntries = getSortedLeaderboardEntries();
    let sortedSize = sortedEntries.size();
    if (sortedSize <= n) { return sortedEntries };
    sortedEntries.sliceToArray(0, n);
  };

  public query ({ caller }) func getOwnLeaderboardEntry() : async ?LeaderboardEntry {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return null;
    };
    switch (userProfiles.get(caller)) {
      case (null) { null };
      case (?profile) {
        let profit = tradingAccounts.values().toArray().filter(func(account) { account.owner == caller }).foldLeft(0.0, func(acc, account) { acc + account.balance });
        ?{ principal = ?caller; name = profile.name; profit };
      };
    };
  };

  // ============================================
  // Withdrawal Requests
  // ============================================

  public shared ({ caller }) func submitWithdrawalRequest(accountId : Nat, amount : Float, bankDetails : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can submit withdrawal requests");
    };
    verifyUserNotBanned(caller);
    let account = getAndVerifyAccountOwnership(accountId, caller);
    if (account.balance < amount) { Runtime.trap("Insufficient balance") };
    let req : WithdrawalRequest = {
      requestId = nextWithdrawalRequestId;
      accountId;
      owner = caller;
      amount;
      bankDetails;
      status = #pending;
      timestamp = Time.now();
      notes = "";
    };
    withdrawalRequests.add(nextWithdrawalRequestId, req);
    nextWithdrawalRequestId += 1;
    req.requestId;
  };

  public query ({ caller }) func getAllWithdrawalRequests() : async [WithdrawalRequest] {
    verifyAdminAccess(caller);
    withdrawalRequests.values().toArray();
  };

  public shared ({ caller }) func approveWithdrawalRequest(requestId : Nat, notes : Text) : async () {
    verifyAdminAccess(caller);
    let req = switch (withdrawalRequests.get(requestId)) {
      case (null) { Runtime.trap("Withdrawal request not found") };
      case (?r) { r };
    };
    let account = switch (tradingAccounts.get(req.accountId)) {
      case (null) { Runtime.trap("Account not found") };
      case (?a) { a };
    };
    let updatedAccount = { account with balance = account.balance - req.amount; freeMargin = account.freeMargin - req.amount };
    tradingAccounts.add(req.accountId, updatedAccount);
    withdrawalRequests.add(requestId, { req with status = #approved; notes });
    // Notify user withdrawal was processed
    addNotificationForUser(req.owner, "Withdrawal Processed", "Your withdrawal of $" # req.amount.toText() # " has been processed successfully.", "withdrawal_approved");
    // Send email notification
    let wdUserEmail = switch (userProfiles.get(req.owner)) {
      case (?p) { p.email };
      case null { "" };
    };
    if (wdUserEmail != "") {
      let _ = await EmailClient.sendRawEmail(
        "no-reply",
        [wdUserEmail],
        [],
        [],
        "Your Mtextrading Withdrawal Has Been Processed",
        "Your withdrawal of $" # req.amount.toText() # " has been processed successfully.

If you did not authorize this withdrawal, please contact our support team immediately.

The Mtextrading Team"
      );
    };
  };

  public shared ({ caller }) func rejectWithdrawalRequest(requestId : Nat, notes : Text) : async () {
    verifyAdminAccess(caller);
    let req = switch (withdrawalRequests.get(requestId)) {
      case (null) { Runtime.trap("Withdrawal request not found") };
      case (?r) { r };
    };
    withdrawalRequests.add(requestId, { req with status = #rejected; notes });
  };

  public query ({ caller }) func getFinancialSummary() : async { totalDeposits : Float; totalWithdrawals : Float; totalBalance : Float; revenue : Float } {
    verifyAdminAccess(caller);
    let txs = transactions.values().toArray();
    let totalDeposits = txs.filter(func(t : Transaction) : Bool { t.transactionType == #deposit and t.status == #completed }).foldLeft(0.0, func(acc : Float, t : Transaction) : Float { acc + t.amount });
    let approvedWithdrawals = withdrawalRequests.values().toArray().filter(func(r : WithdrawalRequest) : Bool { r.status == #approved });
    let totalWithdrawals = approvedWithdrawals.foldLeft(0.0, func(acc : Float, r : WithdrawalRequest) : Float { acc + r.amount });
    let totalBalance = tradingAccounts.values().toArray().foldLeft(0.0, func(acc : Float, a : TradingAccount) : Float { acc + a.balance });
    { totalDeposits; totalWithdrawals; totalBalance; revenue = totalDeposits - totalWithdrawals };
  };

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  // Stripe Functions

  public query func isStripeConfigured() : async Bool {
    switch (stripeConfiguration) {
      case (null) { false };
      case (?conf) { conf.secretKey != "" };
    };
  };

  func getStripeConfiguration() : Stripe.StripeConfiguration {
    switch (stripeConfiguration) {
      case (null) { Runtime.trap("Stripe needs to be first configured") };
      case (?value) { value };
    };
  };

  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    stripeConfiguration := ?config;
  };

  public func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    await Stripe.getSessionStatus(getStripeConfiguration(), sessionId, transform);
  };

  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    await Stripe.createCheckoutSession(getStripeConfiguration(), caller, items, successUrl, cancelUrl, transform);
  };

  // ============================================
  // In-App Support Chat
  // ============================================

  public shared ({ caller }) func sendChatMessage(content : Text, imageData : ?Blob, audioData : ?Blob) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send chat messages");
    };
    verifyUserNotBanned(caller);
    let email = switch (userProfiles.get(caller)) {
      case (?p) { p.email };
      case null { "" };
    };
    let msgId = nextChatMessageId;
    nextChatMessageId += 1;
    chatMessages.add(msgId, {
      id = msgId;
      senderPrincipal = caller;
      senderEmail = email;
      content = content;
      imageData = imageData;
      audioData = audioData;
      timestamp = Time.now();
      isFromAdmin = false;
    });
    msgId;
  };

  public shared ({ caller }) func sendAdminReply(userId : Principal, content : Text, imageData : ?Blob, audioData : ?Blob) : async Nat {
    if (caller.toText() != HARDCODED_ADMIN_PRINCIPAL and not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can send replies");
    };
    let msgId = nextChatMessageId;
    nextChatMessageId += 1;
    chatMessages.add(msgId, {
      id = msgId;
      senderPrincipal = userId;
      senderEmail = "admin";
      content = content;
      imageData = imageData;
      audioData = audioData;
      timestamp = Time.now();
      isFromAdmin = true;
    });
    msgId;
  };

  public query ({ caller }) func getOwnChatMessages() : async [ChatMessage] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view chat messages");
    };
    chatMessages.values().toArray().filter(func(m : ChatMessage) : Bool {
      m.senderPrincipal == caller
    });
  };

  public query ({ caller }) func getAllChatConversations() : async [ChatConversation] {
    if (caller.toText() != HARDCODED_ADMIN_PRINCIPAL and not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all conversations");
    };
    // Collect unique user principals who have sent messages (not admin replies)
    let seenUsers = Map.empty<Principal, Bool>();
    for ((_, msg) in chatMessages.entries()) {
      if (not msg.isFromAdmin) {
        seenUsers.add(msg.senderPrincipal, true);
      };
    };
    // Build conversation summary for each unique user
    let result = List.empty<ChatConversation>();
    for ((userId, _) in seenUsers.entries()) {
      var lastMsg = "";
      var lastTime : Time.Time = 0;
      var unread : Nat = 0;
      let lastRead = switch (chatReadStatus.get(userId)) { case (?t) { t }; case null { 0 } };
      for ((_, msg) in chatMessages.entries()) {
        if (msg.senderPrincipal == userId) {
          if (msg.timestamp > lastTime) {
            lastTime := msg.timestamp;
            lastMsg := msg.content;
          };
          if (not msg.isFromAdmin and msg.timestamp > lastRead) {
            unread += 1;
          };
        };
      };
      let email = switch (userProfiles.get(userId)) { case (?p) { p.email }; case null { "" } };
      result.add({
        userId = userId;
        userEmail = email;
        lastMessage = lastMsg;
        lastMessageTime = lastTime;
        unreadCount = unread;
      });
    };
    result.toArray();
  };

  public query ({ caller }) func getUserChatMessages(userId : Principal) : async [ChatMessage] {
    if (caller.toText() != HARDCODED_ADMIN_PRINCIPAL and not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view user messages");
    };
    chatMessages.values().toArray().filter(func(m : ChatMessage) : Bool {
      m.senderPrincipal == userId;
    });
  };

  public shared ({ caller }) func markConversationRead(userId : Principal) : async () {
    if (caller.toText() != HARDCODED_ADMIN_PRINCIPAL and not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can mark conversations as read");
    };
    chatReadStatus.add(userId, Time.now());
  };

  // ============================================
  // Helper Functions
  // ============================================

  func verifyUserNotBanned(caller : Principal) {
    switch (userProfiles.get(caller)) {
      case (null) { () };
      case (?profile) {
        if (profile.isBanned) {
          Runtime.trap("Account is banned. Please contact support address for appeal");
        };
      };
    };
  };

  let HARDCODED_ADMIN_PRINCIPAL : Text = "4qixx-3hllv-jm445-bwqqh-qdyjf-nnauk-kw52p-jnkte-uro35-xvk3i-4ae";

  func verifySuperAdminAccess(caller : Principal) {
    if (caller.toText() != HARDCODED_ADMIN_PRINCIPAL) {
      Runtime.trap("Unauthorized: Only the super admin can perform this action");
    };
  };

  func verifyAdminAccess(caller : Principal) {
    if (caller.toText() != HARDCODED_ADMIN_PRINCIPAL and not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
  };

  func assertAccountOwnership(account : TradingAccount, caller : Principal) {
    if (account.owner != caller) {
      Runtime.trap("Unauthorized: Can only access your own accounts");
    };
  };

  func assertOrderOpen(order : TradeOrder) {
    if (order.status != #open) {
      Runtime.trap("Order is not open");
    };
  };

  func getInstrumentById(instrumentId : Nat) : MarketInstrument {
    switch (instruments.values().toArray().find(func(i) { i.instrumentId == instrumentId })) {
      case (null) { Runtime.trap("Instrument not found") };
      case (?instrument) { instrument };
    };
  };

  func getAndVerifyAccountOwnership(accountId : Nat, owner : Principal) : TradingAccount {
    let account = switch (tradingAccounts.get(accountId)) {
      case (null) { Runtime.trap("Account not found") };
      case (?a) { a };
    };
    assertAccountOwnership(account, owner);
    account;
  };

  func assertCondition(condition : Bool, message : Text) {
    if (not condition) { Runtime.trap(message) };
  };

  // ============================================
  // Notification Functions
  // ============================================

  func addNotificationForUser(userId : Principal, title : Text, body : Text, notifType : Text) {
    let notif : AppNotification = {
      id = nextNotificationId;
      title = title;
      body = body;
      timestamp = Time.now();
      isRead = false;
      notifType = notifType;
      owner = userId;
    };
    notifications.add(nextNotificationId, notif);
    nextNotificationId += 1;
  };

  public query ({ caller }) func getOwnNotifications() : async [AppNotification] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return [];
    };
    verifyUserNotBanned(caller);
    notifications.values().toArray().filter(func(n) { n.owner == caller });
  };

  public shared ({ caller }) func markNotificationsRead() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    verifyUserNotBanned(caller);
    for ((id, notif) in notifications.entries()) {
      if (notif.owner == caller) {
        notifications.add(id, { notif with isRead = true });
      };
    };
  };


  // ============================================
  // AI Bot Configuration (Super Admin only)
  // ============================================

  public query func getBotConfig() : async BotConfig {
    botConfig;
  };

  public shared ({ caller }) func setBotConfig(config : BotConfig) : async () {
    verifySuperAdminAccess(caller);
    botConfig := config;
  };

  // ============================================
  // Password-based Authentication
  // ============================================

  // App base URL for reset links
  let appBaseUrl : Text = "https://mtextrading.caffeine.ai";
  func getAppBaseUrl() : Text { appBaseUrl };

  // Generate a simple token from time + email
  func generateToken(seed : Text) : Text {
    let now = Time.now();
    let raw = Int.abs(now / 1000) % 1_000_000_000_000;
    let seedLen = seed.size();
    let combined = raw + seedLen;
    let tokenNum = combined % 10_000_000_000_000_000;
    "tk_" # tokenNum.toText() # "_" # seedLen.toText()
  };

  public query func checkEmailRegistered(email : Text) : async Bool {
    passwordHashes.get(email) != null
  };

  public query func isEmailVerified(email : Text) : async Bool {
    switch (verifiedEmails.get(email)) {
      case (?true) { true };
      case _ { false };
    }
  };

  public func registerWithPassword(email : Text, passwordHash : Text) : async () {
    // Block only if email is already fully verified (completed registration)
    let alreadyVerified = switch (verifiedEmails.get(email)) {
      case (?true) { true };
      case _ { false };
    };
    if (alreadyVerified) { Runtime.trap("Email already registered") };
    // Store password hash (email not yet verified — allow retry/resend)
    passwordHashes.add(email, passwordHash);
    // Generate and send OTP code
    let now = Time.now();
    let raw = (now / 1_000) % 1_000_000;
    let rawNat = Int.abs(raw);
    let s = rawNat.toText();
    let len = s.size();
    var pad = "";
    var i = len;
    while (i < 6) { pad := pad # "0"; i += 1 };
    let code = pad # s;
    let expiry = now + 600_000_000_000; // 10 minutes
    otpStore.add(email, { code = code; expiry = expiry });
    let result = await EmailClient.sendRawEmail(
      "no-reply",
      [email],
      [],
      [],
      "Your Mtextrading verification code",
      "Your verification code is: " # code # "\n\nThis code expires in 10 minutes. Do not share it with anyone.\n\nThe Mtextrading Team"
    );
    switch (result) {
      case (#ok) {};
      case (#err(e)) { Runtime.trap("Failed to send verification code: " # e) };
    };
  };

  public func verifyRegistrationOtp(email : Text, code : Text) : async Bool {
    let now = Time.now();
    let valid = switch (otpStore.get(email)) {
      case null { false };
      case (?entry) {
        if (entry.expiry < now) { false }
        else { entry.code == code }
      };
    };
    if (valid) {
      verifiedEmails.add(email, true);
      // Send welcome email — no links
      let _ = await EmailClient.sendRawEmail(
        "no-reply",
        [email],
        [],
        [],
        "Welcome to Mtextrading",
        "Welcome to Mtextrading platform and thank you for registering with us.\n\nThe Mtextrading Team"
      );
    };
    valid
  };

  public func verifyEmailToken(token : Text) : async Text {
    let now = Time.now();
    switch (emailVerificationTokens.get(token)) {
      case null { Runtime.trap("Invalid or expired verification link") };
      case (?entry) {
        if (entry.expiry < now) {
          Runtime.trap("Verification link has expired. Please register again.")
        };
        verifiedEmails.add(entry.email, true);
        emailVerificationTokens.remove(token);
        entry.email
      };
    }
  };

  public query func verifyLoginPassword(email : Text, passwordHash : Text) : async Bool {
    // Check email is verified
    switch (verifiedEmails.get(email)) {
      case (?true) {};
      case _ { return false };
    };
    // Check password hash
    switch (passwordHashes.get(email)) {
      case (?stored) { stored == passwordHash };
      case null { false };
    }
  };

  public func sendPasswordResetEmail(email : Text) : async () {
    // Only send if email is registered
    switch (passwordHashes.get(email)) {
      case null { return }; // silently ignore — don't reveal whether email exists
      case (?_) {};
    };
    let token = generateToken(email # "reset");
    let expiry = Time.now() + 3_600_000_000_000; // 1 hour
    passwordResetTokens.add(token, { email = email; expiry = expiry });
    let resetLink = getAppBaseUrl() # "/#/reset-password?token=" # token;
    let _ = await EmailClient.sendRawEmail(
      "no-reply",
      [email],
      [],
      [],
      "Reset Your Mtextrading Password",
      "You requested a password reset for your Mtextrading account.\n\nClick the link below to set a new password:\n" # resetLink # "\n\nThis link expires in 1 hour. If you did not request a password reset, please ignore this email.\n\nThe Mtextrading Team"
    );
  };

  public func resetPassword(token : Text, newPasswordHash : Text) : async () {
    let now = Time.now();
    let entry = switch (passwordResetTokens.get(token)) {
      case null { Runtime.trap("Invalid or expired reset link") };
      case (?e) { e };
    };
    if (entry.expiry < now) {
      Runtime.trap("Reset link has expired. Please request a new one.");
    };
    passwordHashes.add(entry.email, newPasswordHash);
    passwordResetTokens.remove(token);
    // Send confirmation email
    let _ = await EmailClient.sendRawEmail(
      "no-reply",
      [entry.email],
      [],
      [],
      "Your Mtextrading Password Has Been Changed",
      "Your Mtextrading account password was successfully changed.\n\nIf you made this change, no action is needed.\n\nIf you did not change your password, please contact our support team immediately at mtextradingsupport@gmail.com.\n\nThe Mtextrading Team"
    );
  };


};
