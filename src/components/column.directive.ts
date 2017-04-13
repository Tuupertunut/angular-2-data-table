import {ContentChild, Directive, Input, OnInit} from "@angular/core";
import {RowComponent} from "./row.component";
import {CellCallback} from "./types";

@Directive({
    selector: "data-table-column"
})
export class ColumnDirective implements OnInit {

    // init:
    @Input() header: string;
    @Input() sortable = false;
    @Input() resizable = false;
    @Input() property: string;
    @Input() styleClass: string;
    @Input() cellClasses: CellCallback;

    // init and state:
    @Input() width: number | string;
    @Input() visible = true;

    @ContentChild("dataTableCell") cellTemplate;
    @ContentChild("dataTableHeader") headerTemplate;

    getCellClass(row: RowComponent) {
        if (this.cellClasses !== undefined) {
            return (<CellCallback>this.cellClasses)(row.item, row, this, row.index);
        }
    }

    ngOnInit() {
        this._initCellClass();
    }

    private _initCellClass() {
        if (!this.styleClass && this.property) {
            if (/^[a-zA-Z0-9_]+$/.test(this.property)) {
                this.styleClass = "column-" + this.property;
            } else {
                this.styleClass = "column-" + this.property.replace(/[^a-zA-Z0-9_]/g, "");
            }
        }
    }
}
