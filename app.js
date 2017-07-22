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
        builder.Prompts.text(session, "What's your name?")
    },
    function (session, results) {
        // session.send("Hi! record your voice!!")
        session.dialogData.userName = results.response
        if (!fs.existsSync('voice_reconginize/libsvm-3.22/python/' + results.response + '_train')) { // train case
            builder.Prompts.attachment(session, "Hi! Please tell me your name.")
            //session.dialogData.userName = results.response
            count += 1
        } else { // test case
            console.log('name: ' + results.response)
            session.send('Hello ' + results.response)
            session.dialogData.userName = results.response
            count += 1
            builder.Prompts.attachment(session, "Hi! Please tell me your name to verify!")
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
                    console.log("WTF " + datastring + "><?")
                    loginPermission = (datastring)
                    console.log('========GOT======' + loginPermission)
                    var patt1 = /(\[)-1.0(\])/g;
                    var loginResult = loginPermission.match(patt1);
                    console.log('result: ' + loginResult)

                    if (loginResult === null) {
                        session.send('Login Success!!')
                    } else {
                        session.send('Login Failed!!')
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

            session.send({
                text: "You sent:",
                attachments: [{
                    contentType: attachment.contentType,
                    contentUrl: attachment.contentUrl,
                    name: attachment.name
                }]
            });
        } else {
            session.send("something wrong!!");
        }

        builder.Prompts.text(session, "What stuffs do you want to buy?");
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
            })
            process2.stdout.on('error', function (err) {
                console.log("error" + err)
            })

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

// Add dialog to return list of shirts available
bot.dialog('showShirts', function (session) {
    var msg = new builder.Message(session);
    msg.attachmentLayout(builder.AttachmentLayout.carousel)
    msg.attachments([
        new builder.HeroCard(session)
        .title("Classic White T-Shirt")
        .subtitle("100% Soft and Luxurious Cotton")
        .text("Price is $25 and carried in sizes (S, M, L, and XL)")
        .images([builder.CardImage.create(session, 'https://g-search1.alicdn.com/bao/uploaded/i4/2637669932/TB2UGt8cbXlpuFjy1zbXXb_qpXa_!!2637669932.jpg_240x240q50')])
        .buttons([
            builder.CardAction.imBack(session, "buy classic white t-shirt", "Buy")
        ]),
        new builder.HeroCard(session)
        .title("Classic Gray T-Shirt")
        .subtitle("100% Soft and Luxurious Cotton")
        .text("Price is $25 and carried in sizes (S, M, L, and XL)")
        .images([builder.CardImage.create(session, 'http://www.happybai.com/img/upload/happybai/product/armani-clothes-0806-10_3457541_1444573797364.jpg')])
        .buttons([
            builder.CardAction.imBack(session, "buy classic gray t-shirt", "Buy")
        ]),
        new builder.HeroCard(session)
        .title("Classic Gray T-Shirt")
        .subtitle("100% Soft and Luxurious Cotton")
        .text("Price is $25 and carried in sizes (S, M, L, and XL)")
        .images([builder.CardImage.create(session, 'https://cdn02.pinkoi.com/product/1zMLd5oc/0/500x0.jpg')])
        .buttons([
            builder.CardAction.imBack(session, "buy classic gray t-shirt", "Buy")
        ]),
        new builder.HeroCard(session)
        .title("Classic Blue T-Shirt")
        .subtitle("100% Soft and Luxurious Cotton")
        .text("Price is $25 and carried in sizes (S, M, L, and XL)")
        .images([builder.CardImage.create(session, 'http://www.inif.com.tw/product/image/pics/1inif印衣服-一件也能印，T恤、POLO衫、團體服運動服.bmp')])
        .buttons([
            builder.CardAction.imBack(session, "buy classic gray t-shirt", "Buy")
        ])


    ]);
    session.send(msg).endDialog();
}).triggerAction({
    matches: /^(clothes|list)/i
});