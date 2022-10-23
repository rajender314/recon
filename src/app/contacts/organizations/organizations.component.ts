import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ActivatedRoute, Router } from "@angular/router";

@Component({
  selector: 'app-organizations',
  templateUrl: './organizations.component.html',
  host: {
    class: "contacts-container"
  },
  styleUrls: ['./organizations.component.scss']
})
export class OrganizationsComponent implements OnInit {

  @Input() organizations;
  @Input() orgType;
  @Input() listType;
  @Input() orgCount;
  @Input('isPopup') isPopup: boolean = false;
  @Output() trigger = new EventEmitter<object>();

  public contacts = {
    organizations: [],
    orgType: 0,
    orgCount: 0,
    listType: "list"
  };

  constructor(
    private router: Router
  ) { }

  ngOnInit() {
  }

  ngOnChanges() {
    if (this.organizations){
      this.contacts.organizations = Object.assign([], this.organizations);
    }
    if(this.orgType!=undefined){
      this.contacts.orgType = this.orgType;
    }
    if(this.listType){
      this.contacts.listType = this.listType;
    }
    if(this.orgCount){
      this.contacts.orgCount = this.orgCount;
    }
  }

  changeOrganization(org: any): void{
      //const config = this.router.config.map((route) => Object.assign({}, route));
      //this.router.resetConfig(config);
      this.router.navigate(['/organizations',org.id]);
      this.trigger.emit({org_id: org.id});
  }

  toggleChildOrgs(org: any, event: any): void{
    event.stopImmediatePropagation();
    org['showChildren'] = !org['showChildren'];
  }

}
