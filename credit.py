import requests
import json
from time import gmtime, strftime
import hashlib
import argparse


class Card:
    def __init__(self, CardNO, CreditInterestRate, AvailableCredit, CreditCardLimit):
        self.CardNO = CardNO
        self.CreditInterestRate = CreditInterestRate
        self.AvailableCredit = AvailableCredit
        self.CreditCardLimit = CreditCardLimit


class CreidtReposed:
    def __init__(self, AcctNbr, StatementDate, TransactionAmt, TransactionDate, TransactionDescChinese, TransactionPostingDate):
        self.AcctNbr = AcctNbr
        self.StatementDate = StatementDate
        self.TransactionAmt = TransactionAmt
        self.TransactionDate = TransactionDate
        self.TransactionDescChinese = TransactionDescChinese
        self.TransactionPostingDate = TransactionPostingDate


class Account:
    serverUrl = "http://54.65.120.143:8888/hackathon/"
    token = ""
    cardArray = []

    def __init__(self, CustID, Pin):
        self.CustID = CustID
        self.Pin = Pin

    def login(self):
        rand_token = strftime("%Y%m%d%H%M%S", gmtime())
        payload = {'CustID': self.CustID, 'UserID': self.CustID,
                   'PIN': self.Pin, 'Token': rand_token}
        url = self.serverUrl + "login"
        r = requests.post(url, json=payload)
        if r.status_code == 200:
            auth = r.json()
            self.token = auth['Token']
            self.getCreditCard()

    def getCreditCard(self):
        url = self.serverUrl + "CreditCardLimit"
        payload = {'CustID': self.CustID, 'Token': self.token}
        r = requests.post(url, json=payload)
        if r.status_code == 200:
            data = json.loads(r.text)
            for item in data['CreditCardLimit']:
                card = Card(item['CardNO'], item['CreditInterestRate'],
                            item['AvailableCredit'], item['CreditCardLimit'])
                self.cardArray.append(card)

    def buySomething(self, cardNo, tranAmt, Note):
        self.login()
        url = self.serverUrl + "CreditCardAuthorize"
        payload = {'CardNO': cardNo, 'ExpDate': '1221',
                   'TranAmt': tranAmt, 'TransactionDescChinese': Note}
        r = requests.post(url, json=payload)
        if r.status_code == 200:
            data = json.loads(r.text)
            if data['TranAmt'] == tranAmt:
                data['note'] = Note
                self.writeNewBuyItem(data)
                return self.cardArray[0].AvailableCredit
        return 0

    # fake list
    def getBuyList(self):
        with open('list2.json') as json_data:
            d = json.load(json_data)
        return d

    def writeBuyList(self, data):
        with open('list2.json', 'w') as outfile:
            json.dump(data, outfile)

    def writeNewBuyItem(self, item):
        oldList = self.getBuyList()
        oldList.append(item)
        # print(oldList)
        self.writeBuyList(oldList)


def main():
    account = parse_args().account
    pin = parse_args().pin
    price = parse_args().price
    note = parse_args().note
    option = parse_args().option

    account = Account(account, pin)
    account.login()

    if option == "1":
        print(account.cardArray[0].AvailableCredit)
    elif option == "2":
        print(account.buySomething(account.cardArray[0].CardNO, price, note))
    elif option == "3":
        print(account.getBuyList())


def parse_args():
    parser = argparse.ArgumentParser(description='account')
    parser.add_argument("-a", "--account", help="account",
                        type=str, required=True)
    parser.add_argument("-p", "--pin", help="pin", type=str, required=True)
    # option 1 get credit
    # option 2 buy something
    # optino 3 see list
    parser.add_argument("-o", "--option", help="option",
                        type=str, required=True)
    parser.add_argument("-n", "--price", help="price",
                        type=str, required=False)
    parser.add_argument("-t", "--note", help="note", type=str, required=False)
    args = parser.parse_args()
    return args


# account = Account("B199443055","3055")
# print(account.cardArray[0].AvailableCredit)
# account.writeNewBuyItem()
# account.login()
# account.getCreditCard()
# account.buySomething(account.cardArray[0].CardNO,'100.00','Under Armour')
if __name__ == '__main__':
    main()
