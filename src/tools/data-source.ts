import {DataTableParams} from "../components/types";
import {Observable} from "rxjs";

export interface DataSource<T> {

    queryData(params: DataTableParams): Observable<T[]>;

    getAvailableRowCount(): Observable<number>;
}