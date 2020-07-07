import React, { Component } from 'react';
import { View, ViewPropTypes, TouchableOpacity, TouchableHighlight, Text, AsyncStorage } from 'react-native';
import { getApi, getColor } from '../../../../src/common/common';
/* import { Colors } from '../../../../styles/colors'; */
import Amplify, { API } from 'aws-amplify';
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
import { Colors } from 'react-native/Libraries/NewAppScreen';
import styles from '../../../../src/screens/AddScreen/style';

//Fallback when RN version is < 0.44
const viewPropTypes = ViewPropTypes || View.propTypes;
const EmptyArray = [];

//주수에 따른 달력 높이 설정 위한 변수
var days_len;
let todo_list;
let calendar_dif_list;
let calendar_same_list;


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
    /** calendar flag */
    calendar_flag: PropTypes.number
  };


  constructor(props) {
    super(props);


    this.style = styleConstructor(this.props.theme);

    this.state = {
      currentMonth: props.current ? parseDate(props.current) : XDate(),
      currentMonth_save: props.current ? parseDate(props.current) : XDate(),
      currentMonth_home: props.current ? parseDate(props.current) : XDate(), email: "",
      toDoList: [],
      calendarList: []
    };

    this.updateMonth = this.updateMonth.bind(this);
    this.addMonth = this.addMonth.bind(this);
    this.pressDay = this.pressDay.bind(this);
    this.longPressDay = this.longPressDay.bind(this);
    this.shouldComponentUpdate = shouldComponentUpdate;
  }

  componentDidMount = async () => {

    await AsyncStorage.getItem("email", (errs, result) => {
      if (!errs) {
        if (result !== null) {
          this.setState({ "email": result });
        }
      }
    });

    const path_todolist = "/todolist/getAllDayList/" + JSON.parse(this.state.email);
    const path_calendarlist = "/calendar/getAllDayList/" + JSON.parse(this.state.email);

    if (this.props.calendar_flag == 1) {
      const response_todolist = await getApi("ApiToDoList", path_todolist);
      const response_calendarlist = await getApi("ApiCalendar", path_calendarlist);
      this.setState({ toDoList: response_todolist });
      this.setState({ calendarList: response_calendarlist });
      this.setState({ currentMonth: this.props.Calendarheader_month });
    }
    else {
      this.setState({ currentMonth: this.props.Calendarheader_month });
    }

    this.forceUpdate();
  }

   make_list(day) {
     console.log(day.toString('yyyyMMdd')+1);
       /* calendar_same_list = this.state.calendarList && (this.state.calendarList.map(calendar_same_list => {
       let start_no_dot = calendar_same_list.start_date.substring(0, 10).replace(/\./g, '');
       let end_no_dot = calendar_same_list.end_date.substring(0, 10).replace(/\./g, '');
       if (start_no_dot == day.toString('yyyyMMdd')) {
           return (
             <View style={this.style.calendarContent}>
               <View style={[this.style.calendar_theme, { backgroundColor: getColor(calendar_same_list.color) }]} >
               </View>
               <View style={this.style.calendar_text}>
                 <Text style={{ fontSize: 10, color: "black" }}>{calendar_same_list.title}</Text>
               </View>
             </View>
           )
         }
       }
     ));
     return calendar_same_list; */
   }


  //swipe 기능 설정
  _onLeftFlingHandlerStateChange = ({ nativeEvent }) => {
    if (nativeEvent.oldState === State.ACTIVE) {
      this.addMonth(1);
    }
  }

  //swipe 기능 설정
  _onRightFlingHandlerStateChange = ({ nativeEvent }) => {
    if (nativeEvent.oldState === State.ACTIVE) {
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

  componentDidUpdate = async () => {
    if (this.props.calendar_flag == 1) {
      this.setState({ currentMonth: this.props.Calendarheader_month });
    }
  }

  updateMonth(day, doNotTriggerListeners) {

    if (day.toString('yyyy MM') === this.state.currentMonth.toString('yyyy MM')) {
      return;
    }
    this.setState({
      currentMonth: day.clone()
    }, () => {
      if (!doNotTriggerListeners) {
        const currMont = this.state.currentMonth.clone();

        if (this.props.calendar_flag == 1)
          //메인화면의 년과 월을 바꾸는 함수 호출
          this.props.changeYearMonth(this.state.currentMonth);

        if (this.props.calendar_flag == 3)
          this.props.changeYearMonth(this.state.currentMonth);

        if (this.props.onMonthChange) {
          this.props.onMonthChange(xdateToData(currMont));
        }
        if (this.props.onVisibleMonthsChange) {
          this.props.onVisibleMonthsChange([xdateToData(currMont)]);
        }
      }
    });

  }

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

  pressDay(date) {
    const date_string = date.dateString.toString();
    this._handleDayInteraction(date, this.props.onDayPress);
    if (this.props.calendar_flag == 1) {
      this.props.toggleCalendarModal();
      this.props.setDateModal(true, date_string.slice(5, 7), date_string.slice(8, 10), new Date(date.dateString).getDay());
    }
    else if (this.props.calendar_flag == 2) {
      this.props.changePickerModal(this.state.currentMonth);
      this.props.setDateModal(false, date_string.slice(5, 7), date_string.slice(8, 10), new Date(date.dateString).getDay());
    }
    else {
      this.props.setCalDate(date.year, date.month, date.day, new Date(date.dateString).getDay());
    }
  }

  longPressDay(date) {
    this._handleDayInteraction(date, this.props.onDayLongPress);
  }

  addMonth(count) {
    const new_date = this.state.currentMonth.clone().addMonths(count, true).setDate(1);
    this.updateMonth(this.state.currentMonth.clone().addMonths(count, true));

    if (this.props.calendar_flag == 1) {
      this.props.changePickerModal(this.state.currentMonth.clone().addMonths(count, true));
      if (this.state.currentMonth.clone().addMonths(count, true).toString("yyyy-MM") == this.state.currentMonth_save.toString("yyyy-MM")) {
        const tmp_date = this.state.currentMonth_save;
        this.props.setDateModal(false, new_date.toString('MM'), new_date.toString('dd'), new_date.toString('ddd'));
        this._handleDayInteraction(tmp_date, this.props.onDayPress);
      }
      else {
        this.props.setDateModal(false, new_date.toString('MM'), new_date.toString('dd'), new_date.toString('ddd'));
        this._handleDayInteraction(new_date, this.props.onDayPress);
      }
    }
  }

  renderDay(day, id) {
    const minDate = parseDate(this.props.minDate);
    const maxDate = parseDate(this.props.maxDate);
    let state = '';
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
    // 달력 내에 할일과 일정 합쳐서 다섯개까지만 넣기 위해 사용하는 변수
    let todo_length = 0;
    // 특정 날짜의 할일 목록 갯수를 저장하는 변수
    let todo_array_length = 0;
    // 달력 내에 할일과 일정 합쳐서 다섯개까지만 넣기 위해 사용하는 변수
    let calendar_dif_length = 0;
    let calendar_same_length = 0;
    // 특정 날짜의 일정 목록 갯수를 저장하는 변수
    let calendar_dif_array_length = 0;
    let calendar_same_array_length = 0;
    //일정과 할일의 초가 갯수를 저장하는 변수
    let rest = 0;
    let rest_flag = false;
    let rest_view = null;
    //일정 목록(state)의 시작일과 종료일 값에서 '.'을 제거한 문자열을 저장
    let start_no_dot;
    let end_no_dot;

    //시작일과 종료일이 다른 일정 목록 저장하는 배열
    let calendar_dif_list = this.state.calendarList && (this.state.calendarList.map(calendar_dif_list => {
      let theme;
      let title = null;
      start_no_dot = calendar_dif_list.start_date.substring(0, 10).replace(/\./g, '');
      end_no_dot = calendar_dif_list.end_date.substring(0, 10).replace(/\./g, '');
      if (start_no_dot != end_no_dot) {
        if (start_no_dot <= day.toString('yyyyMMdd') && day.toString('yyyyMMdd') <= end_no_dot) {
          if (start_no_dot == day.toString('yyyyMMdd')) {
            theme = this.style.calendar_start_theme
            title = calendar_dif_list.title
          }
          else if (start_no_dot < day.toString('yyyyMMdd') < end_no_dot) {
            theme = this.style.calendar_mid_theme
          }
          else {
            theme = this.style.calendar_end_theme
          }
          if ((calendar_dif_length) < 4) {
            calendar_dif_array_length += 1;
            calendar_dif_length += 1;
            return (
              <View style={this.style.toDoContent}>
                <View style={[theme, { backgroundColor: getColor(calendar_dif_list.color) }]} >
                  <View style={this.style.toDo_text}>
                    <Text style={{ fontSize: 10, color: "white" }}>{title}</Text>
                  </View>
                </View>
              </View>
            )
          }
          else
            calendar_dif_array_length += 1;
        }
      }
    }));

    //할일 목록 저장하는 배열
    let todo_list = this.state.toDoList && (this.state.toDoList.map(todo_list => {
      if (day.toString('yyyy.MM.dd') === todo_list.end_date.substring(0, 10)) {
        if (todo_length + calendar_dif_length < 4) {
          todo_array_length += 1;
          todo_length += 1;
          return (
            <View style={this.style.toDoContent}>
              <View style={[this.style.toDo_theme, { backgroundColor: getColor(todo_list.color) }]} >
                <View style={this.style.toDo_text}>
                  <Text style={{ fontSize: 10, color: "white" }}>{todo_list.title}</Text>
                </View>
              </View>
            </View>
          )
        }
        else
          todo_array_length += 1;
      }
    }));

    //시작일과 종료일이 같은 일정 목록 저장하는 배열
    let calendar_same_list = this.state.calendarList && (this.state.calendarList.map(calendar_same_list => {
      let start_no_dot = calendar_same_list.start_date.substring(0, 10).replace(/\./g, '');
      if (start_no_dot == day.toString('yyyyMMdd')) {
        if (todo_length + calendar_dif_length + calendar_same_length < 4) {
          calendar_same_array_length += 1;
          calendar_same_length += 1;
          return (
            <View style={this.style.calendarContent}>
              <View style={[this.style.calendar_theme, { backgroundColor: getColor(calendar_same_list.color) }]} >
              </View>
              <View style={this.style.calendar_text}>
                <Text style={{ fontSize: 10, color: "black" }}>{calendar_same_list.title}</Text>
              </View>
            </View>
          )
        }
        else {
          calendar_same_array_length += 1;
        }
      }
    }
    ));

    if (calendar_dif_length == 4 && (calendar_dif_array_length + todo_array_length) >= 5) {
      rest_flag = true;
    }

    if (todo_length != 0 && (calendar_dif_length + todo_length) == 4 && (calendar_dif_array_length + todo_array_length) >= 5) {
      rest_flag = true;
    }

    if (calendar_same_length != 0 && (calendar_dif_length + todo_length + calendar_same_length) == 4 && (calendar_dif_array_length + todo_array_length + calendar_same_array_length) >= 5) {
      rest_flag = true;
    }

    if (rest_flag) {
      rest = (calendar_dif_array_length + todo_array_length + calendar_same_array_length) - 4;
      rest_view = <View style={this.style.calendarContent}>
        <View style={this.style.calendar_text}>
          <Text style={{ fontSize: 10, color: "gray" }}>+{rest}</Text>
        </View>
      </View>;
    }
    else
      rest_view = null;

    if (days.length < 36)
      days_len = "25.4%";
    else
      days_len = "21.9%";

    if (this.props.calendar_flag == 1)
      return (
        <TouchableOpacity onPress={() => { this._handleDayInteraction(day.toString('yyyy-MM-dd'), this.props.onDayPress); this.props.setDateModal(true, day.toString('MM'), day.toString('dd'), day.toString().substring(0, 3)); this.props.toggleCalendarModal() }} >
          <View style={[this.style.home_day, { height: wp(days_len) }]} key={day} >
            <View style={{ /* flex: 1,  */alignItems: 'center', height: wp("6%") }} key={id}>
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
            {todo_list}
            {calendar_dif_list}
            {calendar_same_list}
            {rest_view}
          </View>

        </TouchableOpacity>

      );

    else
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
    let label = '';
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

  renderWeek(days, id) {
    const week = [];
    days.forEach((day, id2) => {
      week.push(this.renderDay(day, id2));
    }, this);

    if (this.props.showWeekNumbers) {
      week.unshift(this.renderWeekNumber(days[days.length - 1].getWeek()));
    }

    if (this.props.calendar_flag == 1)
      return (<View style={[this.style.home_week, { height: wp(days_len) }]} key={id}>{week}
      </View>);
    else
      return (<View style={this.style.week} key={id}>{week}</View>);
  }

  render() {
    const days = dateutils.page(this.state.currentMonth, this.props.firstDay);
    const weeks = [];
    while (days.length) {
      weeks.push(this.renderWeek(days.splice(0, 7), weeks.length));
    }

    let indicator;
    const current = parseDate(this.props.current);
    if (current) {
      const lastMonthOfDay = current.clone().addMonths(1, true).setDate(1).addDays(-1).toString('yyyy-MM-dd');
      if (this.props.displayLoadingIndicator &&
        !(this.props.markedDates && this.props.markedDates[lastMonthOfDay])) {
        indicator = true;
      }
    }

    if (this.props.calendar_flag == 1) {

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
              <View style={this.style.monthView} key={"month"}>{weeks}
              </View>
            </FlingGestureHandler>
          </FlingGestureHandler>
        </View>
      );
    }
  }

}

export default Calendar;