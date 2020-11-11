/**
 * @description: 기존의 react-native-calendars 모듈을 수정
 *               달력의 용도에 맞춰 디자인이나 기능을 다르게 설정
 **/
import React, { Component } from 'react';
import { View, ViewPropTypes, TouchableOpacity, Text, AsyncStorage } from 'react-native';
import { getApi, getColor } from '../../../../src/common/common';
import PropTypes from 'prop-types';
import XDate from 'xdate';
import dateutils from '../dateutils';
import { xdateToData, parseDate } from '../interface';
import styleConstructor from './style';
import Day from './day/basic';
import UnitDay from './day/period';
import MultiDotDay from './day/multi-dot';
import MultiPeriodDay from './day/multi-period';
import SingleDay from './day/custom';
import CalendarHeader from './header';
import shouldComponentUpdate from './updater';
import { SELECT_DATE_SLOT } from '../testIDs';
import { FlingGestureHandler, State, Directions } from 'react-native-gesture-handler';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

//Fallback when RN version is < 0.44
const viewPropTypes = ViewPropTypes || View.propTypes;
const EmptyArray = [];

//주차에 따른 달력 높이 설정 위한 변수 (5주, 6주)
var daysLen;

/**
 * @description: Calendar component
 * @example: https://github.com/wix/react-native-calendars/blob/master/example/src/screens/calendars.js
 * @gif: https://github.com/wix/react-native-calendars/blob/master/demo/calendar.gif
 */
class Calendar extends Component {
  static displayName = 'Calendar';

  static propTypes = {
    /** Specify theme properties to override specific styles for calendar parts. Default = {} */
    theme: PropTypes.object,
    /** Collection of dates that have to be marked. Default = {} */
    markedDates: PropTypes.object,
    /** Specify style for calendar container element. Default = {} */
    style: viewPropTypes.style,
    /** Initially visible month. Default = Date() */
    current: PropTypes.any,
    /** Minimum date that can be selected, dates before minDate will be grayed out. Default = undefined */
    minDate: PropTypes.any,
    /** Maximum date that can be selected, dates after maxDate will be grayed out. Default = undefined */
    maxDate: PropTypes.any,
    /** If firstDay=1 week starts from Monday. Note that dayNames and dayNamesShort should still start from Sunday. */
    firstDay: PropTypes.number,
    /** Date marking style [simple/period/multi-dot/multi-period]. Default = 'simple' */
    markingType: PropTypes.string,
    /** Hide month navigation arrows. Default = false */
    hideArrows: PropTypes.bool,
    /** Display loading indicator. Default = false */
    displayLoadingIndicator: PropTypes.bool,
    /** Do not show days of other months in month page. Default = false */
    hideExtraDays: PropTypes.bool,
    /** Handler which gets executed on day press. Default = undefined */
    onDayPress: PropTypes.func,
    /** Handler which gets executed on day long press. Default = undefined */
    onDayLongPress: PropTypes.func,
    /** Handler which gets executed when month changes in calendar. Default = undefined */
    onMonthChange: PropTypes.func,
    /** Handler which gets executed when visible month changes in calendar. Default = undefined */
    onVisibleMonthsChange: PropTypes.func,
    /** Replace default arrows with custom ones (direction can be 'left' or 'right') */
    renderArrow: PropTypes.func,
    /** Provide custom day rendering component */
    dayComponent: PropTypes.any,
    /** Month format in calendar title. Formatting values: http://arshaw.com/xdate/#Formatting */
    monthFormat: PropTypes.string,
    /** Disables changing month when click on days of other months (when hideExtraDays is false). Default = false */
    disableMonthChange: PropTypes.bool,
    /**  Hide day names. Default = false */
    hideDayNames: PropTypes.bool,
    /** Disable days by default. Default = false */
    disabledByDefault: PropTypes.bool,
    /** Show week numbers. Default = false */
    showWeekNumbers: PropTypes.bool,
    /** Handler which gets executed when press arrow icon left. It receive a callback can go back month */
    onPressArrowLeft: PropTypes.func,
    /** Handler which gets executed when press arrow icon right. It receive a callback can go next month */
    onPressArrowRight: PropTypes.func,
    /** Disable left arrow. Default = false */
    disableArrowLeft: PropTypes.bool,
    /** Disable right arrow. Default = false */
    disableArrowRight: PropTypes.bool,
    /** Style passed to the header */
    headerStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.number, PropTypes.array]),
    /** Provide aria-level for calendar heading for proper accessibility when used with web (react-native-web) */
    webAriaLevel: PropTypes.number,
    /** 메인화면의 달력과 날짜선택 달력을 구분짓기 위한 플래그*/
    // 메인달력(1), 메인헤더의 날짜선택달력(2), 일정, 할일 추가 화면의 날짜선택달력(3)
    calendarFlag: PropTypes.number
  };

  constructor(props) {
    super(props);

    this.style = styleConstructor(this.props.theme);

    this.state = {
      //딜력의 현재 날짜를 저장하는 변수 (달력이 이동함에 따라 변경됨)
      currentMonth: props.current ? parseDate(props.current) : XDate(),
      //오늘 날짜를 저장하는 변수
      currentMonthSave: props.current ? parseDate(props.current) : XDate(),
      //사용자의 이메일 주소 저장하는 변수
      email: "",
      //할일 목록 저장하는 배열
      toDoList: [],
      //일정 목록 저장하는 배열
      calendarList: [],
      //목록 업데이트될때 사용하는 변수
      listChg: false
    };
    //달력의 월을 업데이트하는 함수
    this.updateMonth = this.updateMonth.bind(this);
    //달력의 다음달로 이동하거나 이전달로 이동하기 위한 함수
    this.addMonth = this.addMonth.bind(this);
    //날짜를 클릭했을 시 실행되는 함수 
    this.pressDay = this.pressDay.bind(this);
    this.longPressDay = this.longPressDay.bind(this);
    this.shouldComponentUpdate = shouldComponentUpdate;
  }

  componentDidMount = async () => {
    //사용자의 이메일을 로컬 스토리지에 저장
    await AsyncStorage.getItem("email", (errs, result) => {
      if (!errs) {
        if (result !== null) {
          this.setState({ "email": result });
        }
      }
    });
    //일정과 할일 목록을 설정하는 함수 호출
    this.setCalTodoList();
  }

  //일정과 할일 목록을 설정하는 함수
  setCalTodoList = async () => {
    //할일이 저장되어 있는 경로 나타내는 변수
    const pathTodoList = "/todolist/getAllDayList/" + JSON.parse(this.state.email);
    //일정이 저장되어 있는 경로 나타내는 변수
    const pathCalendarList = "/calendar/getAllDayList/" + JSON.parse(this.state.email);
    //메인 달력일 경우
    if (this.props.calendarFlag === 1) {
      //Api 호출하여 할일 목록 받아옴
      const responseTodoList = await getApi("ApiToDoList", pathTodoList);
      //Api 호출하여 일정 목록 받아옴
      const responseCalendarList = await getApi("ApiCalendar", pathCalendarList);
      //할일과 일정 목록 state 배열에 저장
      this.setState({ toDoList: responseTodoList });
      this.setState({ calendarList: responseCalendarList });
    }
    //메인헤더에 맞춰서 현재 날짜 변경
    this.setState({ currentMonth: this.props.Calendarheader_month });
    //목록 업데이트 변수 false로 설정
    this.setState({listChg : false});
    this.forceUpdate();
  }

  //메인달력을 왼쪽으로 넘겼을때 실행되는 함수
  _onLeftFlingHandlerStateChange = ({ nativeEvent }) => {
    if (nativeEvent.oldState === State.ACTIVE) {
      //다음달로 넘어가기 위한 함수 호출
      this.addMonth(1);
    }
  }

 //메인달력을 오른쪽으로 넘겼을때 실행되는 함수
  _onRightFlingHandlerStateChange = ({ nativeEvent }) => {
    if (nativeEvent.oldState === State.ACTIVE) {
      //이전달로 넘어가기 위한 함수 호출
      this.addMonth(-1);
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const current = parseDate(nextProps.current);
    if (current && current.toString('yyyy MM') !== this.state.currentMonth.toString('yyyy MM')) {
      this.setState({
        currentMonth: current.clone()
      });
    }
  }

  //props나 state가 변경됐을시 실행되는 함수 (메인헤더가 바뀌거나 목록이 업데이트 됐을 경우)
  componentDidUpdate = async () => {
    //메인달력일 경우
    if (this.props.calendarFlag === 1) {
      //메인헤더에 맞춰서 현재날짜 설정
      this.setState({ currentMonth: this.props.Calendarheader_month });
      //목록 업데이트 변수 true로 설정
      this.setState({listChg : true});
      //목록 업데이트 위해 목록 설정 함수 호출
      if(this.state.listChg) {
        this.setCalTodoList();
      } 
    }
  }

  //월을 변경하는 함수
  updateMonth(day, doNotTriggerListeners) {
    //현재 월과 변경하려는 월이 같다면 함수를 진행할 필요가 없으므로 종료
    if (day.toString('yyyy MM') === this.state.currentMonth.toString('yyyy MM')) {
      return;
    }
    //변경하려는 월로 현재 날짜를 변경
    this.setState({
      currentMonth: day.clone()
    }, () => {
      if (!doNotTriggerListeners) {
        const currMont = this.state.currentMonth.clone();
        //메인달력이거나 일정추가화면의 날짜선택 달력일 경우
        //(메인헤더의 날짜선택달력은 날짜를 클릭했을 시에만 헤더를 변경시킴)
        if (this.props.calendarFlag === 1 || this.props.calendarFlag === 3) {
          //메인헤더의 년과 월을 바꾸는 함수 호출
          this.props.changeYearMonth(this.state.currentMonth);
        }
        if (this.props.onMonthChange) {
          this.props.onMonthChange(xdateToData(currMont));
        }
        if (this.props.onVisibleMonthsChange) {
          this.props.onVisibleMonthsChange([xdateToData(currMont)]);
        }
      }
    });

  }

  //선택한 날짜를 마킹하도록 하는 함수
  _handleDayInteraction(date, interaction) {
    const day = parseDate(date);
    const minDate = parseDate(this.props.minDate);
    const maxDate = parseDate(this.props.maxDate);
    if (!(minDate && !dateutils.isGTE(day, minDate)) && !(maxDate && !dateutils.isLTE(day, maxDate))) {
      const shouldUpdateMonth = this.props.disableMonthChange === undefined || !this.props.disableMonthChange;
      if (shouldUpdateMonth) {
        this.updateMonth(day);
      }
      if (interaction) {
        interaction(xdateToData(day));
      }
    }
  }
  //날짜부분(숫자부분)을 클릭했을 시 실행되는 함수
  pressDay(date) {
    //dateToString은 "2020-11-11"과 같은 형태
    const dateToString = date.dateString.toString();
    this._handleDayInteraction(date, this.props.onDayPress);
    //메인달력일 경우
    if (this.props.calendarFlag === 1) {
      //메인화면의 모달창의 날짜를 설정
      this.props.setDateModal(true, dateToString.slice(5, 7), dateToString.slice(8, 10), new Date(date.dateString).getDay());
      //메인화면의 모달창을 띄움 (해당 날짜의 일정과 할일 목록을 확인할 수 있는 모달창)
      this.props.toggleCalendarModal();
    }
    //메인헤더의 날짜 선택 달력일 경우
    else if (this.props.calendarFlag === 2) {
      //날짜선택 모달창의 날짜를 변경
      this.props.changePickerModal(this.state.currentMonth);
      //메인화면 모달창의 날짜를 변경 (메인화면으로 돌아가서 추가버튼을 누를시 바로 해당 날짜가 넘어갈 수 있도록)
      this.props.setDateModal(false, dateToString.slice(5, 7), dateToString.slice(8, 10), new Date(date.dateString).getDay());
    }
    //추가화면의 날짜선택달력일 경우
    else {
      //선택한 날짜 저장
      this.props.setCalDate(date.year, date.month, date.day, new Date(date.dateString).getDay());
    }
  }

  longPressDay(date) {
    this._handleDayInteraction(date, this.props.onDayLongPress);
  }
  
  //달력의 월을 증가시키거나 감소시킴
  addMonth(count) {
    //변경된 달의 1일을 newDate에 저장함 (월이 변경될 시에는 1일을 마킹하기 위해서)
    const newDate = this.state.currentMonth.clone().addMonths(count, true).setDate(1);
    //변경된 달로 현재날짜 업데이트
    this.updateMonth(this.state.currentMonth.clone().addMonths(count, true));
    //메인달력일 경우
    if (this.props.calendarFlag === 1) {
      //날짜선택 모달창의 날짜를 변경
      this.props.changePickerModal(this.state.currentMonth.clone().addMonths(count, true));
      //변경된 달과 오늘자 달이 같다면 
      if (this.state.currentMonth.clone().addMonths(count, true).toString("yyyy-MM") === this.state.currentMonthSave.toString("yyyy-MM")) {
        //메인화면의 모달창의 날짜를 오늘 날짜로 설정
        const tmpDate = this.state.currentMonthSave;
        this.props.setDateModal(false, tmpDate.toString('MM'), tmpDate.toString('dd'), tmpDate.toString('ddd'));
        this._handleDayInteraction(tmpDate, this.props.onDayPress);
      }
      //변경된 달과 오늘자 달이 다르다면
      else {
        //메인화면의 모달창의 날짜를 변경된 달로 설정
        this.props.setDateModal(false, newDate.toString('MM'), newDate.toString('dd'), newDate.toString('ddd'));
        this._handleDayInteraction(newDate, this.props.onDayPress);
      }
    }
  }
  //일 단위의 view를 설정하는 함수
  renderDay(day, id) {
    const minDate = parseDate(this.props.minDate);
    const maxDate = parseDate(this.props.maxDate);
    var state = '';
    if (this.props.disabledByDefault) {
      state = 'disabled';
    } else if ((minDate && !dateutils.isGTE(day, minDate)) || (maxDate && !dateutils.isLTE(day, maxDate))) {
      state = 'disabled';
    } else if (!dateutils.sameMonth(day, this.state.currentMonth)) {
      state = 'disabled';
    } else if (dateutils.sameDate(day, XDate())) {
      state = 'today';
    }

    if (!dateutils.sameMonth(day, this.state.currentMonth) && this.props.hideExtraDays) {
      return (<View key={id} style={{ flex: 1 }} />);
    }

    const DayComp = this.getDayComponent();
    const date = day.getDate();
    const dateAsObject = xdateToData(day);
    const accessibilityLabel = `${state === 'today' ? 'today' : ''} ${day.toString('dddd MMMM d')} ${this.getMarkingLabel(day)}`;
    const days = dateutils.page(this.state.currentMonth, this.props.firstDay);
    //일정과 할일 목록의 총 개수를 저장하는 변수
    var dayArrayLen = 0;
    //화면에 다 표시되지 못한 목록의 개수를 저장하기 위한 변수
    var rest = 0;
    //화면에 다 표시되지 못한 목록이 있는지 확인하기 위한 변수
    var restFlag = false;
     //화면에 다 표시되지 못한 목록의 개수를 화면에 띄우기 위한 변수
    var restView = null;
    //일정 목록(state)의 시작일과 종료일 값에서 '.'을 제거한 문자열을 저장하기 위한 변수들
    var start;
    var end;
    //해당날의 할일 목록과 일정 목록의 순서와 정보들을 이중 배열에 저장
    var dayListInfo = [{ id: "default", uuid: "default", title: "default", color: "default", start_date: "default", end_date: "default" },
    { id: "default", uuid: "default", title: "default", color: "default", start_date: "default", end_date: "default" },
    { id: "default", uuid: "default", title: "default", color: "default", start_date: "default", end_date: "default" },
    { id: "default", uuid: "default", title: "default", color: "default", start_date: "default", end_date: "default" }];
    //오늘의 일정과 할일 목록 인덱스 변수
    var dayIdx = 0;
    //시작일과 종료일이 다른 일정 배열에 저장
    var calendarDifTemp = this.state.calendarList && (this.state.calendarList.map(calendarDifTemp => {
      start = calendarDifTemp.start_date.substring(0, 10).replace(/\./g, '');
      end = calendarDifTemp.end_date.substring(0, 10).replace(/\./g, '');
      //일정 목록 저장
      if (start != end && start <= day.toString('yyyyMMdd') && day.toString('yyyyMMdd') <= end) {
        //배열 인덱스가 4보다 작을 경우에만 배열에 추가
        if (dayIdx < 4) {
          dayListInfo[dayIdx] = { id: "cal_dif", uuid: calendarDifTemp.uuid, title: calendarDifTemp.title, color: calendarDifTemp.color, start_date: start, end_date: end };
          dayIdx += 1;
        }
        //목록의 전체 개수 증가
        dayArrayLen += 1;
      }
    }));
    //시작일과 종료일이 같은 일정 배열에 저장
    var calendarSameTemp = this.state.calendarList && (this.state.calendarList.map(calendarSameTemp => {
      start = calendarSameTemp.start_date.substring(0, 10).replace(/\./g, '');
      end = calendarSameTemp.end_date.substring(0, 10).replace(/\./g, '');
      if (start === end && start === day.toString('yyyyMMdd')) {
        //배열 인덱스가 4보다 작을 경우에만 배열에 추가
        if (dayIdx < 4) {
          dayListInfo[dayIdx] = { id: "cal_same", uuid: calendarSameTemp.uuid, title: calendarSameTemp.title, color: calendarSameTemp.color, start_date: start, end_date: "default" };
          dayIdx += 1;
        }
        //목록의 전체 개수 증가
        dayArrayLen += 1;
      }
    }));
    //할일 배열에 저장
    var toDoTemp = this.state.toDoList && (this.state.toDoList.map(toDoTemp => {
      if (day.toString('yyyy.MM.dd') === toDoTemp.end_date.substring(0, 10)) {
        //배열 인덱스가 4보다 작을 경우에만 배열에 추가
        if (dayIdx < 4) {
          dayListInfo[dayIdx] = { id: "todo", uuid: toDoTemp.uuid, title: toDoTemp.title, color: toDoTemp.color, start_date: "default", end_date: toDoTemp.end_date.substring(0, 10) };
          dayIdx += 1;
        }
        //목록의 전체 개수 증가
        dayArrayLen += 1;
      }
    }));
    
    //일정과 할일 목록의 view를 저장하는 배열 
    //시작일과 종료일이 다른 일정과 같은 일정, 할일을 구분하여 각기 다른 디자인으로 지정
    var calendarToDoList = dayListInfo.map(calendarToDoList => {
      var theme;
      var title = null;
      var date = day.toString('yyyyMMdd');
      //시작일, 종료일이 다른 일정일 경우
      if (calendarToDoList.id === "cal_dif") {
        //해당 날짜가 시작일일 경우
        if (calendarToDoList.start_date === date) {
          theme = this.style.calendar_start_theme
          title = calendarToDoList.title
        }
        //해당 날짜가 종료일일 경우
        else if (calendarToDoList.end_date === date) {
          theme = this.style.calendar_end_theme
        }
        //해당 날짜가 중간일일 경우
        else {
          theme = this.style.calendar_mid_theme
        }
        return (
          <View style={this.style.toDoContent}>
            <View style={[theme, { backgroundColor: getColor(calendarToDoList.color) }]} >
              <View style={this.style.toDo_text}>
                <Text style={{ fontSize: 10, color: "white" }}>{title}</Text>
              </View>
            </View>
          </View>
        )
      }
      //시작일과 종료일이 같은 일정일 경우
      else if (calendarToDoList.id === "cal_same") {
        return (
          <View style={this.style.calendarContent}>
            <View style={[this.style.calendar_theme, { backgroundColor: getColor(calendarToDoList.color) }]} >
            </View>
            <View style={this.style.calendar_text}>
              <Text style={{ fontSize: 10, color: "black" }}>{calendarToDoList.title}</Text>
            </View>
          </View>
        )
      }
      //할일의 경우
      else if (calendarToDoList.id === "todo") {
        return (
          <View style={this.style.toDoContent}>
            <View style={[this.style.toDo_theme, { backgroundColor: getColor(calendarToDoList.color) }]} >
              <View style={this.style.toDo_text}>
                <Text style={{ fontSize: 10, color: "white" }}>{calendarToDoList.title}</Text>
              </View>
            </View>
          </View>
        )
      }
    });

    //배열의 인덱스가 4이면서 목록의 총 갯수가 5개 이상이라면
    if (dayIdx === 4 && dayArrayLen >= 5) {
      //남은 목록 확인 변수 true로 설정
      restFlag = true;
    }
    //남은 목록이 있다면
    if (restFlag) {
      //남은 목록의 갯수를 저장
      rest = dayArrayLen - dayIdx;
      //남은 목록의 개수를 화면에 표시함
      restView = <View style={this.style.calendarContent}>
        <View style={this.style.calendar_text}>
          <Text style={{ fontSize: 10, color: "gray" }}>+{rest}</Text>
        </View>
      </View>;
    }
    else //남은 목록이 없다면 화면에 표시하지 않음
      restView = null;

    //현재 달의 주 수에 따라 달력 높이 설정 (5주, 6주)
    if (days.length < 36)
      daysLen = "25.4%";
    else
      daysLen = "21.9%";

    //메인 달력일 경우
    if (this.props.calendarFlag === 1)
      return (
        //해당 날짜를 클릭할 경우 메인화면의 모달창을 띄우도록 함
        <TouchableOpacity onPress={() => { this._handleDayInteraction(day.toString('yyyy-MM-dd'), this.props.onDayPress); this.props.setDateModal(true, day.toString('MM'), day.toString('dd'), day.toString().substring(0, 3)); this.props.toggleCalendarModal() }} >
          <View style={[this.style.home_day, { height: wp(daysLen) }]} key={day} >
            <View style={{ alignItems: 'center', height: wp("6%") }} key={id}>
              <DayComp
                testID={`${SELECT_DATE_SLOT}-${dateAsObject.dateString}`}
                state={state}
                theme={this.props.theme}
                onPress={this.pressDay}
                onLongPress={this.longPressDay}
                date={dateAsObject}
                marking={this.getDateMarking(day)}
                accessibilityLabel={accessibilityLabel}
              >
                {date}
              </DayComp>
            </View>
            {/* 일정, 할일 목록과 남은 목록 개수를 띄움 */}
            {calendarToDoList}
            {restView}
          </View>
        </TouchableOpacity>

      );

    else //메인 달력이 아닐 경우
      return (
        <View style={{ flex: 1, alignItems: 'center' }} key={id} >
          <DayComp
            testID={`${SELECT_DATE_SLOT}-${dateAsObject.dateString}`}
            state={state}
            theme={this.props.theme}
            onPress={this.pressDay}
            onLongPress={this.longPressDay}
            date={dateAsObject}
            marking={this.getDateMarking(day)}
            accessibilityLabel={accessibilityLabel}
          >
            {date}
          </DayComp>
        </View >
      );


  }

  getMarkingLabel(day) {
    var label = '';
    const marking = this.getDateMarking(day);

    if (marking.accessibilityLabel) {
      return marking.accessibilityLabel;
    }

    if (marking.selected) {
      label += 'selected ';
      if (!marking.marked) {
        label += 'You have no entries for this day ';
      }
    }
    if (marking.marked) {
      label += 'You have entries for this day ';
    }
    if (marking.startingDay) {
      label += 'period start ';
    }
    if (marking.endingDay) {
      label += 'period end ';
    }
    if (marking.disabled || marking.disableTouchEvent) {
      label += 'disabled ';
    }
    return label;
  }

  getDayComponent() {
    if (this.props.dayComponent) {
      return this.props.dayComponent;
    }

    switch (this.props.markingType) {
      case 'period':
        return UnitDay;
      case 'multi-dot':
        return MultiDotDay;
      case 'multi-period':
        return MultiPeriodDay;
      case 'custom':
        return SingleDay;
      default:
        return Day;
    }

  }

  getDateMarking(day) {

    if (!this.props.markedDates) {
      return false;
    }

    const dates = this.props.markedDates[day.toString('yyyy-MM-dd')] || EmptyArray;
    if (dates.length || dates) {
      return dates;
    } else {
      return false;
    }

  }

  renderWeekNumber(weekNumber) {
    return (
      <Day
        key={`week-${weekNumber}`}
        theme={this.props.theme}
        marking={{ disableTouchEvent: true }}
        state='disabled'
      >
        {weekNumber}
      </Day>
    );
  }
  //주 단위의 view를 설정하는 함수
  renderWeek(days, id) {
    const week = [];
    var prev_day;
    //일주일치 날짜가 저장된 days를 분할하여 renderday함수를 호출
    days.forEach((day, id2) => {
      week.push(this.renderDay(day, id2));
    }, this);
    
    if (this.props.showWeekNumbers) {
      week.unshift(this.renderWeekNumber(days[days.length - 1].getWeek()));
    }
    //메인달력일 경우
    if (this.props.calendarFlag === 1)
      return (<View style={[this.style.home_week, { height: wp(daysLen) }]} key={id}>{week}
      </View>);
    else //메인달력이 아닐 경우
      return (<View style={this.style.week} key={id}>{week}</View>);
  }

  render() {
    //현재 달의 모든 날짜들을 저장
    const days = dateutils.page(this.state.currentMonth, this.props.firstDay);
    //주 배열을 선언
    const weeks = [];
    //저장된 날짜들을 주 단위로 쪼개어 renderWeek 함수를 호출
    while (days.length) {
      weeks.push(this.renderWeek(days.splice(0, 7), weeks.length));
    }

    var indicator;
    const current = parseDate(this.props.current);
    if (current) {
      const lastMonthOfDay = current.clone().addMonths(1, true).setDate(1).addDays(-1).toString('yyyy-MM-dd');
      if (this.props.displayLoadingIndicator &&
        !(this.props.markedDates && this.props.markedDates[lastMonthOfDay])) {
        indicator = true;
      }
    }
    //메인 달력일 경우
    if (this.props.calendarFlag === 1) {
      return (
        <View
          style={[this.style.home_container, this.props.style]}
          accessibilityElementsHidden={this.props.accessibilityElementsHidden} // iOS
          importantForAccessibility={this.props.importantForAccessibility} // Android
        >
          <CalendarHeader
            testID={this.props.testID}
            ref={c => this.header = c}
            style={this.props.headerStyle}
            theme={this.props.theme}
            hideArrows={this.props.hideArrows}
            month={this.state.currentMonth}
            addMonth={this.addMonth}
            showIndicator={indicator}
            firstDay={this.props.firstDay}
            renderArrow={this.props.renderArrow}
            monthFormat={this.props.monthFormat}
            hideDayNames={this.props.hideDayNames}
            weekNumbers={this.props.showWeekNumbers}
            onPressArrowLeft={this.props.onPressArrowLeft}
            onPressArrowRight={this.props.onPressArrowRight}
            webAriaLevel={this.props.webAriaLevel}
            disableArrowLeft={this.props.disableArrowLeft}
            disableArrowRight={this.props.disableArrowRight}
          />
          <FlingGestureHandler
            ref={ref => this.leftFlinger = ref}
            direction={Directions.LEFT}
            onHandlerStateChange={ev =>
              this._onLeftFlingHandlerStateChange(ev)
            }>
            <FlingGestureHandler
              ref={ref => this.rightFlinger = ref}
              direction={Directions.RIGHT}
              onHandlerStateChange={ev =>
                this._onRightFlingHandlerStateChange(ev)
              }>
              <View style={this.style.home_monthView} key={"month"}>{weeks}
              </View>
            </FlingGestureHandler>
          </FlingGestureHandler>
        </View>
      );
    }
    //메인 달력이 아닐 경우
    else {
      return (
        <View
          style={[this.style.container, this.props.style]}
          accessibilityElementsHidden={this.props.accessibilityElementsHidden} // iOS
          importantForAccessibility={this.props.importantForAccessibility} // Android
        >
          <CalendarHeader
            testID={this.props.testID}
            ref={c => this.header = c}
            style={this.props.headerStyle}
            theme={this.props.theme}
            hideArrows={this.props.hideArrows}
            month={this.state.currentMonth}
            addMonth={this.addMonth}
            showIndicator={indicator}
            firstDay={this.props.firstDay}
            renderArrow={this.props.renderArrow}
            monthFormat={this.props.monthFormat}
            hideDayNames={this.props.hideDayNames}
            weekNumbers={this.props.showWeekNumbers}
            onPressArrowLeft={this.props.onPressArrowLeft}
            onPressArrowRight={this.props.onPressArrowRight}
            webAriaLevel={this.props.webAriaLevel}
            disableArrowLeft={this.props.disableArrowLeft}
            disableArrowRight={this.props.disableArrowRight}
          />
          <View style={this.style.monthView} key={"month"}>{weeks}
          </View>
        </View>
      );
    }
  }

}

export default Calendar;