import {DataTableParams} from "../components/types";
import {Observable} from "rxjs";

export interface DataSource<T> {

    /* The Observable emits two values. The first is the total available row count, the second is the data filtered
     * according to params.
     *
     * If a data source implementation fetches the data from a database, it probably has to do two different queries.
     * First asking the database for total row count, then asking for the data itself. */
    queryData(params: DataTableParams): Observable<[number, T[]]>;
}