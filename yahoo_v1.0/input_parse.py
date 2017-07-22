#!/usr/bin/env python
# -*- coding: utf-8 -*-
import sys
import os
import jieba
import jieba.posseg as pseg
import logging
import json

reload(sys)
sys.setdefaultencoding('UTF8')


def parse_price(input):
    # support :
    #	1. 價格區間
    #	2. 價格max
    #	3. 價格min
    #words = pseg.cut("價格在 1000 ~ 5000 間")
    words = pseg.cut(input)
    nagtive_word = [u"不", u"不要"]
    exceed_word = [u"超", u"超過", u"多", u"多於", u"高", u"以上" u"以外"]
    below_word = [u"便宜", u"少", u"少於", u"低", u"以內", u"內", u"以下"]
    between_word = [u"間", u"~", u"到"]
    ch_m = {u"十": 10, u"百": 100, u"千": 1000, u"萬": 10000, u"十元": 10, u"百元": 100,
            u"千元": 1000, u"萬元": 10000, u"十塊": 10, u"百塊": 100, u"千塊": 1000, u"萬塊": 10000}
    # 0000 -> 1111 = {nat , ex , be , btw}
    search_flag = [0, 0, 0, 0]
    m = []
    for word, flag in words:
        # print word , flag
        if flag == 'm':
            if word in ch_m:
                m[-1] = m[-1] * ch_m[word]
            elif word.isdigit():
                m.append(int(word))
        if word in nagtive_word:
            search_flag[0] = 1
        if word in exceed_word:
            search_flag[1] = 1
        if word in below_word:
            search_flag[2] = 1
        if word in between_word:
            search_flag[3] = 1
    # print zip(["nat","ex","be","btw"] , search_flag)
    m.sort()
    dic = {}
    if len(m) == 0:
        return dic
    if search_flag[0] == 1:
        if search_flag[1] == 1 and search_flag[2] == 0:
            dic['max'] = str(m[0])
        elif search_flag[1] == 0 and search_flag[2] == 1:
            dic['min'] = str(m[0])
    else:
        if search_flag[1] == 1 and search_flag[2] == 0:
            dic['min'] = str(m[0])
        elif search_flag[1] == 0 and search_flag[2] == 1:
            dic['max'] = str(m[0])
        elif search_flag[3] == 1 and len(m) == 2:
            dic['min'] = str(m[0])
            dic['max'] = str(m[1])
            return dic
    return dic
    # print m


def parse_item(input):
    words = pseg.cut(input)
    #items = []
    item = ""
    for word, flag in words:
        # print word.encode('utf8') , flag.encode('utf8')
        if flag == 'n' or flag == 'eng':
            # items.append(word)
            item += word
            # print "你想要找"  , word , "嗎?"
    return item


def get_yahoo_search_pars(s):
    dic = parse_price(s)
    if len(dic) == 0:
        dic = {}
    item = parse_item(s)
    dic['q'] = item
    return dic


def talk(s):
    dic = get_yahoo_search_pars(s)
    ret = {}
    if dic['q'] == "":
        ret['status'] = u"undefine"
        ret['response'] = u"您想要購買什麼?"
    elif dic['q'] != "" and ("max" not in dic and "min" not in dic):
        ret['status'] = u"noprice"
        ret['response'] = u"是否想要指定購買價格範圍呢?"
        ret['preitem'] = dic['q']
    elif dic['q'] != "" and ("max" in dic or "min" in dic):
        shall = u"python /Users/mac/Documents/chatbuy-azure/yahoo_v1.0/yahoo_api.py "
        # print "dic", dic
        for key in dic:
            shall += " -" + key + " '" + dic[key] + "'"
        shall = shall.encode("utf-8")
        # print "</br> Shall : " + shall + "</br>"
        j = os.popen(shall).read()
        res = j
        # print "res ", json.dumps(res)
        ret['status'] = u"success"
        ret['response'] = json.loads(res)
    else:
        ret['status'] = u"unknown"
        ret['response'] = u"SomethingWrong"
    return ret

# if __name__ == '__main__':
    #sys.tracebacklimit = 0
# jieba.setLogLevel(20)


price_strings = ["價格在1000到5000", "1000~5000",
                 "高於5000", "低於5000", "不要高於5000", "不要低於5000"]
item_strings = ["我想要買superdry的衣服", "衣服", "幫我找衣服", "幫我找衣服和褲子", "衣服和褲子"]
com_strings = ["幫我找電腦", " 我想買iphone", " 我想找1萬以下的手機", " 有uniqlo的衣服嗎？",
               " 我想買最便宜的iphone", " 3千塊以下的addida", " 有白色的airforce嗎？", "我想買一台在10000 到 20000的電腦"]

s = sys.argv[1]
#s = com_strings[-2]
# print s
# print "sys argv[1] "+s+" </br>"
# print talk(s).encode("unicode_escape")
A = talk(s)
# if(A['status'] == u"success"):
# A['response'] = json.loads(A['response'])
# print A['response']
print json.dumps(A, ensure_ascii=False, encoding="UTF-8").encode("unicode_escape")
sys.stdout.flush()
"""
com_strings = [com_strings[-2]]
for s in com_strings:
	print s
	print json.dumps(talk(s) , ensure_ascii=False).encode('utf8')
	#codecs.open("out","w")
"""

"""

com_strings = [com_strings[-1]]
for s in com_strings:
	print s
	dic = get_yahoo_search_pars(s)
	shall = u"python yahoo_api.py "
	for key in dic:
		print key , dic[key]
		shall += " -"+key +" "+dic[key]
	shall = shall.encode("utf-8")
	print shall
	j = os.popen(shall).read()
	print unicode(j)
"""
