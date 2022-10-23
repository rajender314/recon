import { Pipe, PipeTransform } from '@angular/core';

import * as moment from 'moment';

@Pipe({
  name: 'fromNow'
})
export class FromNowPipe implements PipeTransform {

  transform(value: any, args?: any): any {
    let now = moment(),
      time = moment(value),
      timeString: string;

    if (now.format("MM/DD/YYYY") === time.format("MM/DD/YYYY")) {
      timeString = time.fromNow();        
    } else if (now.diff(time, 'days') < 10) {
      timeString = time.calendar();
    } else if (now.get('year') === time.get('year')){
      timeString = time.format('MMM DD, h:mm a');
    } else {
      timeString = time.format('MMM DD YYYY, h:mm a');
    }

    return timeString;
  }

}
