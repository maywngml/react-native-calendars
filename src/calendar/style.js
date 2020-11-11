import { StyleSheet } from 'react-native';
import * as defaultStyle from '../style';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const STYLESHEET_ID = 'stylesheet.calendar.main';

export default function getStyle(theme = {}) {
  const appStyle = { ...defaultStyle, ...theme };
  return StyleSheet.create({
    container: {
      paddingLeft: 5,
      paddingRight: 5,
      backgroundColor: appStyle.calendarBackground
    },
    monthView: {
      backgroundColor: appStyle.calendarBackground
    },
    week: {
      marginTop: 7,
      marginBottom: 7,
      flexDirection: 'row',
      justifyContent: 'space-around'
    },
    home_container: {
      width: wp("100%"),
      height: hp("100%")
    },
    home_monthView: {
      height: hp("100%")
    },
    home_week: {
      marginBottom: 0.5,
      flexDirection: 'row',
      justifyContent: 'space-around',
      width: wp("100%")
    },
    home_day: {
      flex: 1,
      alignItems: 'center',
      width: wp("14.3%")
    },
    calendarContent: {
      marginBottom: 1,
      flexDirection: 'row',
      top: wp("1%")
    },
    calendar_theme: {
      width: wp("0.7%"),
      height: hp("1.7%"),
      left: wp("0.56%")
    },
    calendar_text: {
      width: wp("13%"),
      height: hp("1.7%"),
      left: wp("0.8%"),
      bottom: wp("0.3%")
    },
    calendar_start_theme: {
      marginBottom: 1,
      width: wp("13.6%"),
      height: hp("1.7%"),
      left: wp("0.3%"),
      borderTopLeftRadius: 1,
      borderBottomLeftRadius: 1
    },
    calendar_mid_theme: {
      marginBottom: 1,
      width: wp("14.5%"),
      height: hp("1.7%")
    },
    calendar_end_theme: {
      marginBottom: 1,
      width: wp("14.6%"),
      height: hp("1.7%"),
      borderTopRightRadius: 1,
      borderBottomRightRadius: 1
    },
    toDoContent: {
      marginBottom: 1,
      top: wp("1%")
    },
    toDo_theme: {
      marginBottom: 1,
      width: wp("13%"),
      height: hp("1.7%"),
      borderRadius: 1
    },
    toDo_text: {
      width: wp("12%"),
      height: hp("1.7%"),
      left: wp("0.5%"),
      bottom: wp("0.3%")
    },
    ...(theme[STYLESHEET_ID] || {})
  });
}
