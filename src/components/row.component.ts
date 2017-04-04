import {Component, EventEmitter, forwardRef, Inject, Input, OnDestroy, Output} from "@angular/core";
import {DataTableComponent} from "./data-table.component";

@Component({
    selector: "[dataTableRow]",
    template: `
        <tr class="data-table-row"
            [title]="getTooltip()"
            [style.background-color]="dataTable.getRowColor(item, index, _this)"
            [class.row-odd]="index % 2 === 0"
            [class.row-even]="index % 2 === 1"
            [class.selected]="selected"
            [class.clickable]="dataTable.selectOnRowClick || dataTable.expandOnRowClick"
            (dblclick)="dataTable.rowDoubleClicked(_this, $event)"
            (click)="dataTable.rowClicked(_this, $event)"
        >
            <td [hide]="!dataTable.expandColumnVisible" (click)="expanded = !expanded; $event.stopPropagation()" class="row-expand-button">
                <span class="glyphicon glyphicon-triangle-right" [hide]="expanded"></span>
                <span class="glyphicon glyphicon-triangle-bottom" [hide]="!expanded"></span>
            </td>
            <td [hide]="!dataTable.indexColumnVisible" class="index-column" [textContent]="displayIndex"></td>
            <td [hide]="!dataTable.selectColumnVisible" class="select-column">
                <input type="checkbox" [(ngModel)]="selected"/>
            </td>
            <td *ngFor="let column of dataTable.columns" [hide]="!column.visible" [ngClass]="column.styleClassObject" class="data-column"
                [style.background-color]="column.getCellColor(_this, index)">
                <div *ngIf="!column.cellTemplate" [textContent]="item[column.property]"></div>
                <div *ngIf="column.cellTemplate" [ngTemplateOutlet]="column.cellTemplate" [ngOutletContext]="{column: column, row: _this, item: item}"></div>
            </td>
        </tr>
        <tr *ngIf="dataTable.expandColumn || dataTable.expandOnRowClick" [hide]="!expanded" class="row-expansion">
            <td [attr.colspan]="dataTable.columnCount">
                <div [ngTemplateOutlet]="dataTable.expandTemplate" [ngOutletContext]="{row: _this, item: item}"></div>
            </td>
        </tr>
    `,
    styles: [`
        .select-column {
            text-align: center;
        }

        .row-expand-button {
            cursor: pointer;
            text-align: center;
        }

        .clickable {
            cursor: pointer;
        }
    `]
})
export class RowComponent implements OnDestroy {

    @Input() item: any;
    @Input() index: number;

    expanded: boolean;

    // row selection:

    private _selected: boolean;

    @Output() selectedChange = new EventEmitter();

    get selected() {
        return this._selected;
    }

    set selected(selected) {
        this._selected = selected;
        this.selectedChange.emit(selected);
    }

    // other:

    get displayIndex() {
        if (this.dataTable.pagination) {
            return this.dataTable.displayParams.offset + this.index + 1;
        } else {
            return this.index + 1;
        }
    }

    getTooltip() {
        if (this.dataTable.rowTooltip) {
            return this.dataTable.rowTooltip(this.item, this, this.index);
        }
        return "";
    }

    constructor(@Inject(forwardRef(() => DataTableComponent)) public dataTable: DataTableComponent) {
    }

    ngOnDestroy() {
        this.selected = false;
    }

    private _this = this; // FIXME is there no template keyword for this in angular 2?
}
