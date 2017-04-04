import {DataSource} from "./data-source";
import {DataTableParams} from "../components/types";
import * as _ from "lodash";
import {Observable, Observer} from "rxjs";

export class ArrayDataSource<T> implements DataSource<T> {

    private array: T[];
    private customSortFunctions: Map<string, (first: T, second: T) => number>;

    constructor(array: T[], customSortFunctions?: Map<string, (first: T, second: T) => number>) {
        this.array = array;
        this.customSortFunctions = (customSortFunctions != undefined) ? customSortFunctions : new Map();
    }

    queryData(params: DataTableParams): Observable<T[]> {
        return Observable.create((observer: Observer<T[]>) => {

            let sortBy: string = params.sortBy; //May be undefined
            let sortAsc: boolean = (params.sortAsc != undefined) ? params.sortAsc : true;
            let offset: number = (params.offset != undefined) ? params.offset : 0;
            let limit: number = (params.limit != undefined) ? params.limit : this.array.length;

            let array: T[] = this.array;

            if (sortBy != undefined) {
                if (this.customSortFunctions.has(sortBy)) {

                    array = _.clone(array);
                    array.sort(this.customSortFunctions.get(sortBy));
                    if (!sortAsc) {
                        array.reverse();
                    }
                } else {
                    array = _.orderBy(array, sortBy, (sortAsc) ? "asc" : "desc");
                }
            }

            array = array.slice(offset, offset + limit);

            observer.next(array);
            observer.complete();
        });

    }

    getAvailableRowCount(): Observable<number> {
        return Observable.create((observer: Observer<number>) => {

            observer.next(this.array.length);
            observer.complete();
        });
    }
}