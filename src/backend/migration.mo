import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";

module {
  public type OldTradingAccount = {
    owner : Principal;
    accountId : Nat;
    accountType : { #demo; #live };
    currency : Text;
    balance : Float;
    equity : Float;
    margin : Float;
    freeMargin : Float;
  };

  public type NewTradingAccount = {
    accountId : Nat;
    accountCode : Text;
    owner : Principal;
    accountType : { #demo; #live };
    currency : Text;
    balance : Float;
    equity : Float;
    margin : Float;
    freeMargin : Float;
  };

  public type OldActor = {
    tradingAccounts : Map.Map<Nat, OldTradingAccount>;
    // other old state fields
  };

  public type NewActor = {
    tradingAccounts : Map.Map<Nat, NewTradingAccount>;
    // other new state fields
  };

  public func run(old : OldActor) : NewActor {
    let newTradingAccounts = old.tradingAccounts.map<Nat, OldTradingAccount, NewTradingAccount>(
      func(_id, oldAccount) {
        let accountCode = switch (oldAccount.accountType) {
          case (#demo) {
            "DEMO-" # oldAccount.accountId.toText();
          };
          case (#live) {
            "LIVE-" # oldAccount.accountId.toText();
          };
        };
        {
          accountId = oldAccount.accountId;
          accountCode;
          owner = oldAccount.owner;
          accountType = oldAccount.accountType;
          currency = oldAccount.currency;
          balance = oldAccount.balance;
          equity = oldAccount.equity;
          margin = oldAccount.margin;
          freeMargin = oldAccount.freeMargin;
        };
      }
    );
    { old with tradingAccounts = newTradingAccounts };
  };
};

