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

    getCellClass(item: any, row: RowComponent, index: number): string {
        if (this.cellClasses !== undefined) {
            return (<CellCallback>this.cellClasses)(item, row, this, index);
        }
    }

    getCellNgClass(row: RowComponent): string[] {
        let classes: string[] = [];

        if (this.styleClass != undefined) {
            classes.push(this.styleClass);
        }

        let newClass: string = this.getCellClass(row.item, row, row.index);
        if (newClass != undefined) {
            classes.push(newClass);
        }

        return classes;
    }

    getSubstituteCellNgClass(index: number): string[] {
        let classes: string[] = [];

        if (this.styleClass != undefined) {
            classes.push(this.styleClass);
        }

        let newClass: string = this.getCellClass(null, null, index);
        if (newClass != undefined) {
            classes.push(newClass);
        }

        return classes;
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
