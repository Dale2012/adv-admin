/**
 * User: willerce
 */

var crypto = require('crypto');
var config = require('../global.js').config;
var database = require('../global.js').database;
var nodemailer = require('nodemailer');
var moment = require('moment');
var http = require('http');

//对moment模块的一些扩展及定义
moment.timezoneOffset = function (zone) {
  var diff = moment().zone() + (zone * 60);
  return moment().add('minutes', diff);
};

/**
 * md5 hash
 *
 * @param str
 * @returns md5 str
 */
exports.md5 = function (str) {
  var md5sum = crypto.createHash('md5');
  md5sum.update(str);
  str = md5sum.digest('hex');
  return str;
};

/**
 * 加密函数
 * @param str 源串
 * @param secret  因子
 * @returns str
 */
exports.encrypt = function (str, secret) {
  var cipher = crypto.createCipher('aes192', secret);
  var enc = cipher.update(str, 'utf8', 'hex');
  enc += cipher.final('hex');
  return enc;
};

/**
 * 解密
 * @param str
 * @param secret
 * @returns str
 */
exports.decrypt = function (str, secret) {
  var decipher = crypto.createDecipher('aes192', secret);
  var dec = decipher.update(str, 'hex', 'utf8');
  dec += decipher.final('utf8');
  return dec;
};

exports.gen_session = function (name, password, res) {
  var auth_token = this.encrypt(name + '\t' + password, config.session_secret);
  res.cookie(config.auth_cookie_name, auth_token, {
    path: '/',
    maxAge: 1000 * 60 * 60 * 24 * 3
  }); // cookie 有效期1周
};

exports.get_week = { '-1': '全部', '0': '星期天', '1': '星期一', '2': '星期二', '3': '星期三', '4': '星期四', '5': '星期五', '6': '星期六'};

exports.getUTC8Time = function (format) {
  if (format)
    return moment.timezoneOffset(config.time_zone).format(format);
  else
    return moment.timezoneOffset(config.time_zone);
};

exports.getUTC8Day = function (format) {
  return new Date(this.getUTC8Time()).getDay();
};


/*初始化nodemailer*/
var transport = nodemailer.createTransport("SMTP", {
  service: config.nodeMailer.service,
  auth: {
    user: config.nodeMailer.auth.user,
    pass: config.nodeMailer.auth.pass
  }
});

/**
 * 发送邮件
 */
exports.sendMail = function (options, callback) {
  transport.sendMail({
    from: config.nodeMailer.auth.from,
    to: options.to,
    subject: options.subject,
    text: options.text
  }, function (err, resStatus) {
    if (err) {
      console.log(err);
      callback(err);
    }
    console.log(resStatus);
    callback(null);
  });
}


exports.getBody=function(body,startStr,endStr){
    if(body == undefined || body ==''){
        return false;
    }
    if(startStr == undefined || startStr ==''){
        return false;
    }
    if(endStr == undefined || endStr ==''){
        return false;
    }
    if(body.indexOf(startStr) !=-1) {
//         console.log(body.indexOf(startStr));
        var str = body.substr(body.indexOf(startStr) + startStr.length)   ;
//         console.log(str.indexOf(endStr));
        str = str.substring(0,str.indexOf(endStr));
        return str;
    }
    return false;
}

exports.getPage=function(url,charset,callback){
    var html = '';
    var req =http.get(url, function (res) {
        res.setEncoding('binary');//or hex
        res.on('data',function (data) {//加载数据,一般会执行多次
            html += data;
        }).on('end', function () {
                var buf=new Buffer(html,'binary');//这一步不可省略
                var tempCharset = this.getBody(html,'charset=','"');
                if(tempCharset){
                    var str=iconv.decode(buf, tempCharset);//将GBK编码的字符转换成utf8的
                } else {
                    var str=iconv.decode(buf, charset);//将GBK编码的字符转换成utf8的
                }
                callback(str);
            })
    }).on('error', function(err) {
            console.log("http get error:",err);
            callback(false);
        });

};
exports.randomNumber = function(input){
    var numInput = new Number(input);
    var numOutput = new Number(Math.random() * numInput).toFixed(0);
    return numOutput;
}