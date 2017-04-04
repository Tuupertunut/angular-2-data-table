import {Component, ContentChild, ContentChildren, EventEmitter, Input, OnInit, Output, QueryList, TemplateRef, ViewChildren} from "@angular/core";
import {ColumnDirective} from "./column.directive";
import {RowComponent} from "./row.component";
import {DataTableParams, DataTableTranslations, defaultTranslations, RowCallback} from "./types";
import {drag} from "../utils/drag";
import {DataSource} from "../tools/data-source";
import {Observable} from "rxjs";

@Component({
    selector: "data-table",
    template: `
        <div class="data-table-wrapper">
            <data-table-header *ngIf="header"></data-table-header>

            <div class="data-table-box">
                <table class="table table-condensed table-bordered data-table">
                    <thead>
                        <tr>
                            <th [hide]="!expandColumnVisible" class="expand-column-header">
                            <th [hide]="!indexColumnVisible" class="index-column-header">
                                <span [textContent]="indexColumnHeader"></span>
                            </th>
                            <th [hide]="!selectColumnVisible" class="select-column-header">
                                <input [hide]="!multiSelect" type="checkbox" [(ngModel)]="selectAllCheckbox"/>
                            </th>
                            <th *ngFor="let column of columns" #th [hide]="!column.visible" (click)="headerClicked(column, $event)"
                                [class.sortable]="column.sortable" [class.resizable]="column.resizable"
                                [ngClass]="column.styleClassObject" class="column-header" [style.width]="column.width | px">
                                <span *ngIf="!column.headerTemplate" [textContent]="column.header"></span>
                                <span *ngIf="column.headerTemplate" [ngTemplateOutlet]="column.headerTemplate" [ngOutletContext]="{column: column}"></span>
                                <span class="column-sort-icon" *ngIf="column.sortable">
                                    <span class="glyphicon glyphicon-sort column-sortable-icon" [hide]="column.property === sortBy"></span>
                                    <span [hide]="column.property !== sortBy">
                                        <span class="glyphicon glyphicon-triangle-top" [hide]="sortAsc"></span>
                                        <span class="glyphicon glyphicon-triangle-bottom" [hide]="!sortAsc"></span>
                                    </span>
                                </span>
                                <span *ngIf="column.resizable" class="column-resize-handle" (mousedown)="resizeColumnStart($event, column, th)"></span>
                            </th>
                        </tr>
                    </thead>
                    <tbody *ngFor="let item of items; let index=index" class="data-table-row-wrapper"
                           dataTableRow #row [item]="item" [index]="index" (selectedChange)="onRowSelectChanged(row)">
                    </tbody>
                    <tbody class="substitute-rows" *ngIf="pagination && substituteRows">
                        <tr *ngFor="let item of substituteItems, let index = index"
                            [class.row-odd]="(index + items.length) % 2 === 0"
                            [class.row-even]="(index + items.length) % 2 === 1"
                        >
                            <td [hide]="!expandColumnVisible"></td>
                            <td [hide]="!indexColumnVisible">&nbsp;</td>
                            <td [hide]="!selectColumnVisible"></td>
                            <td *ngFor="let column of columns" [hide]="!column.visible">
                        </tr>
                    </tbody>
                </table>
                <div class="loading-cover" *ngIf="showReloading && reloading"></div>
            </div>

            <data-table-pagination *ngIf="pagination"></data-table-pagination>
        </div>
    `,
    styles: [`
        /* bootstrap override: */

        :host /deep/ .data-table.table > tbody + tbody {
            border-top: none;
        }

        :host /deep/ .data-table.table td {
            vertical-align: middle;
        }

        :host /deep/ .data-table > thead > tr > th,
        :host /deep/ .data-table > tbody > tr > td {
            overflow: hidden;
        }

        /* I can't use the bootstrap striped table, because of the expandable rows */
        :host /deep/ .row-odd {
            background-color: #F6F6F6;
        }

        :host /deep/ .row-even {
        }

        .data-table .substitute-rows > tr:hover,
        :host /deep/ .data-table .data-table-row:hover {
            background-color: #ECECEC;
        }

        /* table itself: */

        .data-table {
            box-shadow: 0 0 15px rgb(236, 236, 236);
            table-layout: fixed;
        }

        /* header cells: */

        .column-header {
            position: relative;
        }

        .expand-column-header {
            width: 50px;
        }

        .select-column-header {
            width: 50px;
            text-align: center;
        }

        .index-column-header {
            width: 40px;
        }

        .column-header.sortable {
            cursor: pointer;
        }

        .column-header .column-sort-icon {
            float: right;
        }

        .column-header.resizable .column-sort-icon {
            margin-right: 8px;
        }

        .column-header .column-sort-icon .column-sortable-icon {
            color: lightgray;
        }

        .column-header .column-resize-handle {
            position: absolute;
            top: 0;
            right: 0;
            margin: 0;
            padding: 0;
            width: 8px;
            height: 100%;
            cursor: col-resize;
        }

        /* cover: */

        .data-table-box {
            position: relative;
        }

        .loading-cover {
            position: absolute;
            width: 100%;
            height: 100%;
            background-color: rgba(255, 255, 255, 0.3);
            top: 0;
        }
    `]
})
export class DataTableComponent implements DataTableParams, OnInit {

    private _dataSource: DataSource<any>;

    @Input()
    get dataSource(): DataSource<any> {
        return this._dataSource;
    }

    set dataSource(dataSource: DataSource<any>) {
        this._dataSource = dataSource;
        this._triggerReload();
    }

    availableRowCount: number = 0;
    items: any[] = [];

    // UI components:

    @ContentChildren(ColumnDirective) columns: QueryList<ColumnDirective>;
    @ViewChildren(RowComponent) rows: QueryList<RowComponent>;
    @ContentChild("dataTableExpand") expandTemplate: TemplateRef<any>;

    // One-time optional bindings with default values:

    @Input() headerTitle: string;
    @Input() header = true;
    @Input() pagination = true;
    @Input() indexColumn = true;
    @Input() indexColumnHeader = "";
    @Input() rowColors: RowCallback;
    @Input() rowTooltip: RowCallback;
    @Input() selectColumn = false;
    @Input() multiSelect = true;
    @Input() substituteRows = true;
    @Input() expandColumn = false;
    @Input() translations: DataTableTranslations = defaultTranslations;
    @Input() selectOnRowClick = false;
    @Input() expandOnRowClick = false;
    @Input() autoReload = true;
    @Input() showReloading = false;

    // UI state without input:

    indexColumnVisible: boolean;
    selectColumnVisible: boolean;
    expandColumnVisible: boolean;

    // UI state: visible ge/set for the outside with @Input for one-time initial values

    private _sortBy: string;
    private _sortAsc = true;

    private _offset = 0;
    private _limit = 10;

    @Input()
    get sortBy() {
        return this._sortBy;
    }

    set sortBy(value) {
        this._sortBy = value;
        this._triggerReload();
    }

    @Input()
    get sortAsc() {
        return this._sortAsc;
    }

    set sortAsc(value) {
        this._sortAsc = value;
        this._triggerReload();
    }

    @Input()
    get offset() {
        return this._offset;
    }

    set offset(value) {
        this._offset = value;
        this._triggerReload();
    }

    @Input()
    get limit() {
        return this._limit;
    }

    set limit(value) {
        this._limit = value;
        this._triggerReload();
    }

    // calculated property:

    @Input()
    get page() {
        return Math.floor(this.offset / this.limit) + 1;
    }

    set page(value) {
        this.offset = (value - 1) * this.limit;
    }

    get lastPage() {
        return Math.ceil(this.availableRowCount / this.limit);
    }

    // setting multiple observable properties simultaneously

    sort(sortBy: string, asc: boolean) {
        this.sortBy = sortBy;
        this.sortAsc = asc;
    }

    // init

    ngOnInit() {
        this._initDefaultValues();
        this._initDefaultClickEvents();
        this._updateDisplayParams();

        if (this.autoReload && this._scheduledReload == null) {
            this.reloadItems();
        }
    }

    private _initDefaultValues() {
        this.indexColumnVisible = this.indexColumn;
        this.selectColumnVisible = this.selectColumn;
        this.expandColumnVisible = this.expandColumn;
    }

    private _initDefaultClickEvents() {
        this.headerClick.subscribe(tableEvent => this.sortColumn(tableEvent.column));
        if (this.selectOnRowClick) {
            this.rowClick.subscribe(tableEvent => tableEvent.row.selected = !tableEvent.row.selected);
        }
        if (this.expandOnRowClick) {
            this.rowClick.subscribe(tableEvent => tableEvent.row.expanded = !tableEvent.row.expanded);
        }
    }

    // Reloading:

    _reloading = false;

    get reloading() {
        return this._reloading;
    }

    @Output() reload = new EventEmitter();

    reloadItems() {
        this._reloading = true;

        let params: DataTableParams = this._getRemoteParameters();

        if (this._dataSource != undefined) {

            /* Combining two observables to wait until both emit a value. Both values are then stored together in the "value" array. */
            Observable.zip(this._dataSource.getAvailableRowCount(), this._dataSource.queryData(params)).subscribe((value: [number, any[]]) => {
                this.availableRowCount = value[0];
                this.items = value[1];

                this._onReloadFinished();
                this.reload.emit(params);
            });
        } else {

            /* If dataSource is undefined, set empty items. */
            this.availableRowCount = 0;
            this.items = [];

            this._onReloadFinished();
            this.reload.emit(params);
        }
    }

    private _onReloadFinished() {
        this._updateDisplayParams();

        this._selectAllCheckbox = false;
        this._reloading = false;
    }

    _displayParams = <DataTableParams>{}; // params of the last finished reload

    get displayParams() {
        return this._displayParams;
    }

    _updateDisplayParams() {
        this._displayParams = {
            sortBy: this.sortBy,
            sortAsc: this.sortAsc,
            offset: this.offset,
            limit: this.limit
        };
    }

    _scheduledReload = null;

    // for avoiding cascading reloads if multiple params are set at once:
    _triggerReload() {
        if (this._scheduledReload) {
            clearTimeout(this._scheduledReload);
        }
        this._scheduledReload = setTimeout(() => {
            this.reloadItems();
        });
    }

    // event handlers:

    @Output() rowClick = new EventEmitter();
    @Output() rowDoubleClick = new EventEmitter();
    @Output() headerClick = new EventEmitter();
    @Output() cellClick = new EventEmitter();

    private rowClicked(row: RowComponent, event) {
        this.rowClick.emit({
            row,
            event
        });
    }

    private rowDoubleClicked(row: RowComponent, event) {
        this.rowDoubleClick.emit({
            row,
            event
        });
    }

    private headerClicked(column: ColumnDirective, event: MouseEvent) {
        if (!this._resizeInProgress) {
            this.headerClick.emit({
                column,
                event
            });
        } else {
            this._resizeInProgress = false; // this is because I can't prevent click from mousup of the drag end
        }
    }

    private cellClicked(column: ColumnDirective, row: RowComponent, event: MouseEvent) {
        this.cellClick.emit({
            row,
            column,
            event
        });
    }

    // functions:

    private _getRemoteParameters(): DataTableParams {
        let params = <DataTableParams>{};

        if (this.sortBy) {
            params.sortBy = this.sortBy;
            params.sortAsc = this.sortAsc;
        }
        if (this.pagination) {
            params.offset = this.offset;
            params.limit = this.limit;
        }
        return params;
    }

    private sortColumn(column: ColumnDirective) {
        if (column.sortable) {
            let ascending = this.sortBy === column.property ? !this.sortAsc : true;
            this.sort(column.property, ascending);
        }
    }

    get columnCount() {
        let count = 0;
        count += this.indexColumnVisible ? 1 : 0;
        count += this.selectColumnVisible ? 1 : 0;
        count += this.expandColumnVisible ? 1 : 0;
        this.columns.toArray().forEach(column => {
            count += column.visible ? 1 : 0;
        });
        return count;
    }

    private getRowColor(item: any, index: number, row: RowComponent) {
        if (this.rowColors !== undefined) {
            return (<RowCallback>this.rowColors)(item, row, index);
        }
    }

    // selection:

    selectedRow: RowComponent;
    selectedRows: RowComponent[] = [];

    private _selectAllCheckbox = false;

    get selectAllCheckbox() {
        return this._selectAllCheckbox;
    }

    set selectAllCheckbox(value) {
        this._selectAllCheckbox = value;
        this._onSelectAllChanged(value);
    }

    private _onSelectAllChanged(value: boolean) {
        this.rows.toArray().forEach(row => row.selected = value);
    }

    onRowSelectChanged(row: RowComponent) {

        // maintain the selectedRow(s) view
        if (this.multiSelect) {
            let index = this.selectedRows.indexOf(row);
            if (row.selected && index < 0) {
                this.selectedRows.push(row);
            } else if (!row.selected && index >= 0) {
                this.selectedRows.splice(index, 1);
            }
        } else {
            if (row.selected) {
                this.selectedRow = row;
            } else if (this.selectedRow === row) {
                this.selectedRow = undefined;
            }
        }

        // unselect all other rows:
        if (row.selected && !this.multiSelect) {
            this.rows.toArray().filter(row_ => row_.selected).forEach(row_ => {
                if (row_ !== row) { // avoid endless loop
                    row_.selected = false;
                }
            });
        }
    }

    // other:

    get substituteItems() {
        return Array.from({length: this.displayParams.limit - this.items.length});
    }

    // column resizing:

    private _resizeInProgress = false;

    private resizeColumnStart(event: MouseEvent, column: ColumnDirective, columnElement: HTMLElement) {
        this._resizeInProgress = true;

        drag(event, {
            move: (moveEvent: MouseEvent, dx: number) => {
                if (this._isResizeInLimit(columnElement, dx)) {
                    column.width = columnElement.offsetWidth + dx;
                }
            }
        });
    }

    resizeLimit = 30;

    private _isResizeInLimit(columnElement: HTMLElement, dx: number) {
        /* This is needed because CSS min-width didn't work on table-layout: fixed.
         Without the limits, resizing can make the next column disappear completely,
         and even increase the table width. The current implementation suffers from the fact,
         that offsetWidth sometimes contains out-of-date values. */
        if ((dx < 0 && (columnElement.offsetWidth + dx) <= this.resizeLimit) ||
            !columnElement.nextElementSibling || /* resizing doesn't make sense for the last visible column */
            (dx >= 0 && ((<HTMLElement> columnElement.nextElementSibling).offsetWidth + dx) <= this.resizeLimit)) {
            return false;
        }
        return true;
    }
}
