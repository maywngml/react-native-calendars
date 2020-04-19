import {StyleSheet} from 'react-native';
import * as defaultStyle from '../style';
import {widthPercentageToDP as wp, heightPercentageToDP as hp} from 'react-native-responsive-screen'; 

const STYLESHEET_ID = 'stylesheet.calendar.main';

export default function getStyle(theme={}) {
  const appStyle = {...defaultStyle, ...theme};
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
      width:wp("100%"),
      backgroundColor: appStyle.calendarBackground
    },
    home_monthView: {
      height: 480
    },
    home_week: {
      marginBottom: 0.5,
      flexDirection: 'row',
      justifyContent: 'space-around',
      width: wp("100%"),
      height:90
    },
    home_day: {
      width:wp("14.28571428571429%"),
      height:100,
      backgroundColor: "white"
    },
    home_line: {
      width:wp("100%"),
      height:1,
      backgroundColor: "lightgray"
    },
    modal_container: {
      alignItems:"center",
        width:340,
        height:400,
        backgroundColor: 'white',
        borderRadius: 10,
        left: wp("4%")
    },
    ...(theme[STYLESHEET_ID] || {})
  });
}
