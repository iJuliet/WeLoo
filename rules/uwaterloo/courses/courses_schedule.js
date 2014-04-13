var uwapi = require('../../../utils/uwapi');
var utils = require('../../../utils/utils');


/**
 * If next request from user is valid, then return next()
 */
module.exports = function(webot) {
  // Exam Command Rule
  webot.waitRule('wait_course_for_schedule', function(info, next) {
    info = utils.sanitizeInfo(info);

    console.log(info.text);
    
    if (utils.findCommand(info.text)) {
      console.log('Next Command is: '+info.text);
      next();
    }
    else{
      var invalid_format_reply = utils.localizedText(webot, 
      {
        'en_us' : 'Invalid format. Please follow this format: CS116 MATH115 ECON101',
        'zh_cn' : '格式不正确，请仿照以下格式：CS116 MATH115 ECON101'
      });
      var no_match_reply = utils.localizedText(webot,
      {
        'en_us' : 'Oops! No match!\nPlease try again.',
        'zh_cn' : '抱歉，查无此课！\n请重新输入。'
      });


      try{
        var subjects = (/\D+/g).exec(info.text);
        var catalogNums = info.text.match(/\d+/g);
        var course_type = info.text.match(/\s+\D+/g);
        console.info("Subjects: " + subjects);
        console.info("Course Numbers: " + catalogNums);
        console.info("Course Type: " + course_type);


        var requestCounter = subjects.length;
        var titles = new Array();
        var descriptions = new Array();
        for (var i = 0; i < subjects.length; i++) {
          (function(i) {
            var subject = subjects[i].trim();
            var catalogNum = catalogNums[i].trim();
            uwapi.getjson('courses/'+subject+'/'+catalogNum+'/schedule', function(data) {
            //No Course found
            var lectures = new Array();
            var others = new Array();
            if (data['meta']['message'] == 'No data returned') {
              info.rewait();
              next(null, no_match_reply);
            } 
            else {
              //handle reponse data
              console.info(data['data']);
              data = data['data'];
              //data contains a list of sections 
              
              for (var i = 0; i < data.length; i++) {
                var course_data = data[i];
                var section = course_data['section'];
                if (section.substring(0,3) == "LEC" ){
                  lectures.push(course_data);
                }else{
                  others.push(course_data);
                };

              };
              console.info(lectures);

              var result = new Array();
              result.push("请输入数字查询详细信息:");
              if(course_type == " LEC" || course_type == ' lec'){
                for (var i = 0; i < lectures.length; i++) {
                  var course = lectures[i]['section'];
                  var date = lectures[i]['classes'][0]['date'];
                  console.info(date);
                  var start_time = date['start_time'];
                  var end_time = date['end_time'];
                  var weekdays = date['weekdays'];
                  var first_line =(i+1)+". "+ course+" "+start_time+"-"+end_time+" "+weekdays;

                  //console.info(start_time);
                  result.push(first_line);
                };
              }else{
                for (var i = 0; i < others.length; i++) {
                  var course = others[i]['section'];
                  var date = others[i]['classes'][0]['date'];
                  console.info(date);
                  var start_time = date['start_time'];
                  var end_time = date['end_time'];
                  var weekdays = date['weekdays'];
                  var first_line =(i+1)+". "+ course+" "+start_time+"-"+end_time+" "+weekdays;

                  //console.info(start_time);
                  result.push(first_line);
                  result.push(course);
                };
              };

            titles.push(subject+catalogNums+": "+data[0]['title']);
            descriptions.push(result.join("\n"));

              //titles.push(course+'\n'+date+' '+day+'\n'+start+' - '+end);
              //descriptions.push(result.join('\n'));
              requestCounter--;
              if (requestCounter == 0) {
                var finalDesc = descriptions.join('\n') + 
                utils.localizedText(webot, 
                {
                  'en_us' : '\nFor Exam Calendar, Click 「Read All」',
                  'zh_cn' : '\n查看考试日历，请点击「阅读全文」'
                });
                var reply = {
                  title: titles.join('\n\n'),
                  description: finalDesc,
                  url: 'http://www.uwaterloo.ca'
                };
                info.rewait();
                next(null, reply);
              }
            }
          });

          })(i);
        }

      }catch(err) {
        info.rewait();
        next(null, invalid_format_reply);
      }
    };
    

  });
  webot.waitRule('wait_course_detail'),function(info,next){
    info = utils.sanitizeInfo(info);

    console.log(info.text);
    
    if (utils.findCommand(info.text)) {
      console.log('Next Command is: '+info.text);
      return next();
    }
  }
  webot.set('course schedule', {
    description: 'Use \'courses\' command to get course schedule of a course or a list of course',
    pattern: /^(courses)(\s*)/i,
    handler: function(info) {
      info = utils.sanitizeInfo(info);
      info.wait('wait_course_for_schedule');
      return utils.localizedText(webot, 
        {
          'en_us' : 'Please enter your courses, e.g. [CS116 LEC] [MATH115 TUT] ',
          'zh_cn' : '请输入你要查询的课程, 例如：[CS116 LEC] [MATH115 TUT] '
        }
      );
    }
  });
}