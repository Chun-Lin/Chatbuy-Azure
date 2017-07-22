var restify = require('restify');
var builder = require('botbuilder');
var https = require('https');
var fs = require('fs');
var PythonShell = require('python-shell');
var spawn = require("child_process").spawn;
var count = 0


// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    // appId: process.env.MICROSOFT_APP_ID,
    // appPassword: process.env.MICROSOFT_APP_PASSWORD
    appId: 'a5835b16-d536-403a-810f-19c389187e16',
    appPassword: 'oULbSQdXgcHdbNmajnbwsSQ'
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

var bot = new builder.UniversalBot(connector, [
    //...Default dialog waterfall steps...
    function (session) {
        builder.Prompts.text(session, "我還沒有好好認識你呢，你の名字是(づ′▽`)づ？")
    },
    function (session, results) {
        // session.send("Hi! record your voice!!")
        session.dialogData.userName = results.response
        if (!fs.existsSync('voice_reconginize/libsvm-3.22/python/' + results.response + '_train')) { // train case
            builder.Prompts.attachment(session, session.dialogData.userName + " 你的名字，親口講給我聽好不好，希望你不會嫌我煩 (´///☁///`)")
            //session.dialogData.userName = results.response
            count += 1
        } else { // test case
            // console.log('name: ' + results.response)
            // session.send('Hello ' + results.response)
            session.dialogData.userName = results.response
            count += 1
            builder.Prompts.attachment(session, session.dialogData.userName + "你的名字，親口講給我聽好不好，希望你不會嫌我煩 (´///☁///`)")
            // builder.Prompts.text(session, "What stuffs do you want to buy?");
        }
    },
    function (session, results) {
        if (results.response) {
            console.log('response url %s', results.response[0].contentUrl)
            attachment = results.response[0]
            console.log('response type %s', attachment.contentType)
            console.log('response url %s', attachment.contentUrl)
            console.log('response name %s', attachment.name)
            if (!fs.existsSync('voice_reconginize/libsvm-3.22/python/' + session.dialogData.userName + '_train')) {
                // console.log(session.dialogData)
                if (count < 10) {
                    var file = fs.createWriteStream("voice_reconginize/train_data/" + session.dialogData.userName + "0" + count + ".mp3");
                    var request = https.get(attachment.contentUrl, function (response) {
                        response.pipe(file);
                    });
                } else {
                    var file = fs.createWriteStream("voice_reconginize/train_data/" + session.dialogData.userName + count + ".mp3");
                    var request = https.get(attachment.contentUrl, function (response) {
                        response.pipe(file);
                    });
                }
                // execute python trian srcript
                var process = spawn("python", ["/Users/mac/Documents/chatbuy-azure/voice_reconginize/libsvm-3.22/python/hackTrain.py", session.dialogData.userName]);
                //var process = spawn("python", ["/Users/mac/Documents/chatbuy-azure/voice_reconginize/libsvm-3.22/python/test.py"]);
                // To do: modify here to parse the return results
                process.stdout.on('data', function (data) {
                    tmp = hex2a(data.toString('hex'))
                    // console.log(tmp)
                    /*
                    console.log(data)
                    if (true) {
                        builder.Prompts.text(session, )
                    } else {
                        builder.Prompts.text(session, )
                    }
                    */
                });


            } else {
                console.log('test!!!!')
                var file = fs.createWriteStream("voice_reconginize/test_data/" + session.dialogData.userName + ".mp3");
                var request = https.get(attachment.contentUrl, function (response) {
                    response.pipe(file);
                });
                // execute python test script
                // To do: where is the file's path??????
                var process = spawn('python', ["/Users/mac/Documents/chatbuy-azure/voice_reconginize/libsvm-3.22/python/hackTest.py", session.dialogData.userName, "voice_reconginize/test_data/" + session.dialogData.userName + ".mp3"]);
                // To do: modify here to parse the return results
                var datastring = ''
                process.stdout.on('data', function (data) {
                    datastring += data;
                });
                process.stdout.on('end', function (XD) {
                    console.log("@@" + XD + "@@")
                    // console.log("WTF " + datastring + "><?")
                    loginPermission = (datastring)
                    // console.log('========GOT======' + loginPermission)
                    var patt1 = /(\[)-1.0(\])/g;
                    var loginResult = loginPermission.match(patt1);
                    // console.log('result: ' + loginResult)

                    if (loginResult != null) {
                        builder.Prompts.text(session, "你的聲音好好聽 (*´∀`)~♥，我已經記住了唷！既然已經是朋友了的話，想要買什麼都可以跟我說喲～");

                        // session.send('你的聲音好好聽 (*´∀`)~♥，我已經記住了唷！既然已經是朋友了的話，想要買什麼都可以跟我說喲～');
                    } else {
                        session.send('聲音失敗： 可能是我這附近太吵了我沒聽清楚，再講一次給人家聽好不好？');
                    }
                    // builder.Prompts.text(session, tmp)
                });

                // session.send('Login Failed!!')


            }
            /*
            var file = fs.createWriteStream("voice_reconginize/train_data/" + session.dialogData.userName + ".mp3");
            var request = https.get(attachment.contentUrl, function (response) {
                response.pipe(file);
            });
            */

            // var process = spawn('python', ["/Users/mac/Documents/chatbuy-azure/yahoo_v1.0/input_parse.py", results.response]);

            // process.stdout.on('data', function (data) {

            //     var yahooResponseObj
            //     yahooResponseObj = JSON.parse(hex2a(data.toString('hex')))
            //     console.log('yahooResponseObj: ' + yahooResponseObj);

            //     console.log(yahooResponseObj.response)

            //     var status = yahooResponseObj.status
            //     session.dialogData.status = status
            //     session.dialogData.reply = yahooResponseObj.response
            //     session.dialogData.preitem = yahooResponseObj.preitem

            //     builder.Prompts.text(session, yahooResponseObj.response)

            // })

            // var options = {
            //     mode: 'text',
            //     pythonPath: '/usr/local/bin/python',
            //     pythonOptions: [''],
            //     scriptPath: '/Users/mac/Documents/chatbuy-azure/yahoo_v1.0',
            //     args: ['']
            // };

            // PythonShell.run('hackTest.py', options, function (err, results) {
            //     if (err) throw err;
            //     // results is an array consisting of messages collected during execution 
            //     console.log('results: %j', results);
            // });

            // PythonShell.run('yahoo_v1.0/input_parse.py', function (err, results) {
            //     if (err) throw err;
            //     // results is an array consisting of messages collected during execution 
            //     console.log('results: %j', results);
            // })

            // To do: if test return yes, echo seccess login, else echo fail

            // session.send({
            //     text: "You sent:",
            //     attachments: [{
            //         contentType: attachment.contentType,
            //         contentUrl: attachment.contentUrl,
            //         name: attachment.name
            //     }]
            // });
        } else {
            session.send("something wrong!!");
        }

        // builder.Prompts.text(session, "你的聲音好好聽 (*´∀`)~♥，我已經記住了唷！既然已經是朋友了的話，想要買什麼都可以跟我說喲～");
    },
    function (session, results) {
        console.log('session: ' + session)
        console.log(results.response);
        // base64_encode_response = new Buffer(results.response).toString('base64')


        var process = spawn('python', ["/Users/mac/Documents/chatbuy-azure/yahoo_v1.0/input_parse.py", results.response]);

        process.stdout.on('data', function (data) {

            var yahooResponseObj
            console.log(data.toString('hex'))
            yahooResponseObj = JSON.parse(hex2a(data.toString('hex')))
            console.log('yahooResponseObj: ' + yahooResponseObj);

            console.log(yahooResponseObj.response)

            var status = yahooResponseObj.status
            session.dialogData.status = status
            session.dialogData.reply = yahooResponseObj.response
            session.dialogData.preitem = yahooResponseObj.preitem

            builder.Prompts.text(session, yahooResponseObj.response)

        })

        process.on('close', (code) => {
            console.log(`child process exited with code ${code}`);
        });
        process.on('end', (code) => {
            console.log(`child process exited with end ${code}`);
        });

        // session.send("you want %s", results.response);
    },
    function (session, results) {
        console.log(results.response)
        // base64_encode_response = new Buffer(results.response).toString('base64')

        if (session.dialogData.status === 'noprice') {
            console.log("check pt 1");
            var preitem = session.dialogData.preitem;

            secondReply = preitem + results.response
            console.log(secondReply)
            var process2 = spawn("python", ["/Users/mac/Documents/chatbuy-azure/yahoo_v1.0/input_parse.py", secondReply]);
            var tmp_string = ""
            process2.stdout.on('data', function (data) {
                tmp_string += data;
                console.log("here data ==" + data)
                dataObj = JSON.parse(data)
                console.log('imageURL:' + dataObj.response.shop1.imageUrl)
                console.log('TYPE: ' + typeof dataObj.response.shop1.imageUrl)

                session.dialogData.shopUrl = dataObj.response.shop1.url


                var msg = new builder.Message(session);
                msg.attachmentLayout(builder.AttachmentLayout.carousel)
                msg.attachments([
                    new builder.HeroCard(session)
                    .title("價錢 NT$" + dataObj.response.shop1.price)
                    .subtitle(dataObj.response.shop1.url)
                    .images([builder.CardImage.create(session, dataObj.response.shop1.imageUrl)])
                    .buttons([
                        builder.CardAction.imBack(session, "buy " + dataObj.response.shop1.price, "購買")
                    ]),
                    new builder.HeroCard(session)
                    .title("價錢 NT$" + dataObj.response.shop2.price)
                    .subtitle(dataObj.response.shop2.url)
                    .images([builder.CardImage.create(session, dataObj.response.shop2.imageUrl)])
                    .buttons([
                        builder.CardAction.imBack(session, "buy " + dataObj.response.shop2.price, "購買")
                    ]),
                    new builder.HeroCard(session)
                    .title("價錢 NT$" + dataObj.response.shop3.price)
                    .subtitle(dataObj.response.shop3.url)
                    .images([builder.CardImage.create(session, dataObj.response.shop3.imageUrl)])
                    .buttons([
                        builder.CardAction.imBack(session, "buy " + dataObj.response.shop3.price, "購買")
                    ])

                ]);
                session.send(msg).endDialog();
            })
            process2.stdout.on('error', function (err) {
                console.log("error" + err)
            })

            // process.stdout.on('data', function (data) {

            //     var yahooResponseObj
            //     console.log(data.toString('hex'))
            //     yahooResponseObj = JSON.parse(hex2a(data.toString('hex')))
            //     console.log('yahooResponseObj: ' + yahooResponseObj);

            //     console.log(yahooResponseObj.response)

            //     var status = yahooResponseObj.status
            //     session.dialogData.status = status
            //     session.dialogData.reply = yahooResponseObj.response
            //     session.dialogData.preitem = yahooResponseObj.preitem

            //     builder.Prompts.text(session, yahooResponseObj.response)

            // })

            // process.stdout.on('end', function (xdd) {
            //     console.log("@@" + xdd + "@@")

            //     console.log('===data===' + tmp_string)
            //     // var yahooECResponseObj
            //     // yahooECResponseObj = JSON.parse(hex2a(data.toString('hex')))
            //     // console.log('yahooResponseObj: ' + yahooECResponseObj);

            //     // console.log(yahooResponseObj.response)
            //     // builder.Prompts.text(session, yahooResponseObj.response)

            // })

            // process.on('close', (code) => {
            //     console.log(`child process exited with code ${code}`);
            // });
        }
    }


]);

function hex2a(hexx) {
    var hex = hexx.toString(); //force conversion
    var str = '';
    for (var i = 0; i < hex.length; i += 2)
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return str;
}


// Add dialog to handle 'Buy' button click
bot.dialog('buyButtonClick', [
    function (session, args, next) {
        var result = args.intent.matched.input.match(/\d+/g)
        if (result == null) {
            price = session.userData.dataPrice;
        } else {
            price = result[0]
            session.userData.dataPrice = price;
        }

        if (price) {
            console.log(price);
            var msg = new builder.Message(session);
            msg.attachmentLayout(builder.AttachmentLayout.carousel)
            msg.attachments([
                new builder.HeroCard(session)
                .title("恭喜，您選了一件很棒的商品！")
                .buttons([
                    builder.CardAction.openUrl(session, "http://goo.gl/cGkMJU", "前往商品"),
                    builder.CardAction.imBack(session, "yes" + price, "購買"),
                    builder.CardAction.imBack(session, "no", "不要")
                ])
            ])
            session.send(msg).endDialog();

        } else {
            // Invalid product
            session.send("I'm sorry... That product wasn't found.").endDialog();
        }
    },
    function (session, results) {
        // Save size if prompted
        var item = session.dialogData.item;
        if (results.response) {
            item.size = results.response.entity.toLowerCase();
        }

        // Add to cart
        if (!session.userData.cart) {
            session.userData.cart = [];
        }
        session.userData.cart.push(item);

        // Send confirmation to users
        session.send("A '%(size)s %(product)s' has been added to your cart.", item).endDialog();
    }
]).triggerAction({
    matches: /(buy|add)/i
});



// Add dialog to handle 'Buy' button click
bot.dialog('confirmButtonClick', [
    function (session, args, next) {
        var result = args.intent.matched.input.match(/\d+/g)
        if (args.intent.matched[0] == "yes") {
            session.userData.count = 0
            price = result[0]

            var process3 = spawn("python", ["/Users/mac/Documents/chatbuy-azure/credit.py", "-a", "B199443055", "-p", "3055", "-n", price, "-t", "mbp", "-o", "2"]);

            var tmp_string = ""
            process3.stdout.on('data', function (data) {
                tmp_string += data;
                console.log("CTBC data ==" + data)
                console.log('data type: ' + typeof data)
                if (data != 0) {
                    console.log('test data')
                    var date = new Date();
                    session.send('您已於' + date.toLocaleString() + '，以中國信託信用卡（卡片末四碼3055）付款NT$' + price + '。 查看商品：https://tw.bid.yahoo.com/item/100332347060。 卡片餘額為 NT$ ' + data + "。");
                    session.send(' 謝謝您使用FinChat，我們會越來越好～也恭喜您今天也為了社會的經濟流動付出了一份心力 σ`∀´)σ').endDialog();

                } else {
                    session.send('您沒有錢拉～～～').endDialog();
                }
            })
        } else if (args.intent.matched[0] == "no") {
            var msg = new builder.Message(session);
            var button = [
                builder.CardAction.imBack(session, "nothing", "真的不考慮")
            ];
            button.push(builder.CardAction.imBack(session, "buy", "我考慮看看"))

            msg.attachmentLayout(builder.AttachmentLayout.carousel)
            msg.attachments([
                new builder.HeroCard(session)
                .title("什麼～真的不考慮看看嗎？")
                .buttons(button)
            ])
            session.send(msg).endDialog();
        } else {
            // Invalid product
            // location.href = session.dialogData.shopUrl
            session.send("感謝支持").endDialog();
        }
    }
]).triggerAction({
    matches: /(yes|no|nothing)/i
});