import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'domSearch'
})
export class DomSearchPipe implements PipeTransform {

  transform(items: any, searchText?: any, propName?: any, storeCount?: any): any {
    if(!searchText) return items;
    searchText = searchText.toLowerCase();

    let filteredArr = items.filter(o => {
      return o[propName].toLowerCase().includes(searchText);
    });

    if(storeCount)
      storeCount.count = filteredArr.length;

    return  filteredArr;

  }

}
