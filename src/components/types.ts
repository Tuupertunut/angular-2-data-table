import {RowComponent} from "./row.component";
import {ColumnDirective} from "./column.directive";


export type RowCallback = (item: any, row: RowComponent, index: number) => string;

export type CellCallback = (item: any, row: RowComponent, column: ColumnDirective, index: number) => string;

// export type HeaderCallback = (column: ColumnDirective) => string;


export interface DataTableTranslations {
    indexColumn: string;
    selectColumn: string;
    expandColumn: string;
    paginationLimit: string;
    paginationRange: string;
}

export const defaultTranslations = <DataTableTranslations>{
    indexColumn: "index",
    selectColumn: "select",
    expandColumn: "expand",
    paginationLimit: "Limit",
    paginationRange: "Results"
};


export interface DataTableParams {
    offset?: number;
    limit?: number;
    sortBy?: string;
    sortAsc?: boolean;
}
