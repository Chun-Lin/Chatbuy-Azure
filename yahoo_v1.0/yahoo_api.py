import requests
import codecs
import json
#from bs4 import BeautifulSoup
import argparse


def main():
    iquery = parse_args().query
    iproperty = parse_args().property
    sort = parse_args().sort
    minvalue = parse_args().minprice
    # print minvalue
    maxvalue = parse_args().maxprice
    if iproperty == None:
        iproperty = "bid"
    if sort == None:
        sort = "rel"
    if maxvalue == None and minvalue == None:
        url = "https://tw.search.ec.yahoo.com/api/affiliate/v1/search/items?q=" + \
            iquery + "&property=" + iproperty + "&sort=" + sort
    elif maxvalue != None and minvalue == None:
        url = "https://tw.search.ec.yahoo.com/api/affiliate/v1/search/items?q=" + iquery + \
            "&property=" + iproperty + "&sort=" + \
            sort + "&maximumPrice=" + str(maxvalue)
    elif maxvalue == None and minvalue != None:
        url = "https://tw.search.ec.yahoo.com/api/affiliate/v1/search/items?q=" + iquery + \
            "&property=" + iproperty + "&sort=" + \
            sort + "&minimumPrice=" + str(minvalue)
    else:
        url = "https://tw.search.ec.yahoo.com/api/affiliate/v1/search/items?q=" + iquery + "&property=" + \
            iproperty + "&sort=" + sort + "&minimumPrice=" + \
            str(minvalue) + "&maximumPrice=" + str(maxvalue)
    r = requests.get(url)
    #soup = BeautifulSoup(r.content, 'html.parser')
    #f =open('b.txt',"w")
    # f.write(str(soup))
    # f.close()
    j = r.json()
    dic = json.loads(json.dumps(j, ensure_ascii=False))
    data = {}
    for i in range(5):
        shopone = dic['items'][i]
        price = shopone['price']
        if 'bidprice' in shopone.keys():
            bidprice = shopone['bidprice']
        else:
            bidprice = '0'
        description = ""
        imageUrl = shopone['imageUrl']
        url = shopone['url']
        # print 'price' +
        # price+'description'+description+'imageUrl'+imageUrl+'url'+url
        data['shop' + str(i)] = {'price':  price, 'description': description,
                                 'imageUrl': imageUrl, 'url': url, 'bidprice': bidprice}
    """
	with open('shop.json', 'w') as outfile:
		json.dump(data, outfile)
	"""
    # print "</br>QQQQQQQQ in yahoo api </br>"
    print json.dumps(data, ensure_ascii=False).encode('utf8')
    # print json.dumps(data , encoding="utf-8")


def parse_args():
    parser = argparse.ArgumentParser(description='shop!!!')
    parser.add_argument("-q", "--query", help="query item",
                        type=str, required=True)
    parser.add_argument("-p", "--property",
                        help="choose shop", type=str, required=False)
    parser.add_argument("-s", "--sort", help="sort", type=str, required=False)
    parser.add_argument("-min", "--minprice",
                        help="minvalue", type=str, required=False)
    parser.add_argument("-max", "--maxprice",
                        help="maxvalue", type=str, required=False)
    args = parser.parse_args()
    return args


if __name__ == '__main__':
    main()
