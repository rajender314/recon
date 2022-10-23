import { Component, OnInit, Inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonService } from '@app/common/common.service';
import { MAT_DIALOG_DATA, MatDialogRef, MatSnackBar } from '@angular/material';
import * as _ from 'lodash';
import { forkJoin } from 'rxjs';
import { SnackbarComponent } from '@app/shared/material/snackbar/snackbar.component';

@Component({
  selector: 'app-add-estimate',
  templateUrl: './add-estimate.component.html',
  styleUrls: ['./add-estimate.component.scss'],
  host: {
    class: 'add-estimates-container'
  }
})
export class AddEstimateComponent implements OnInit {

  public state = {
    loader: true,
    products: [],
    unlockCreateEstimate: false,
    checkAllProducts: false,
    checkAllTasks: false,
    checkAllExpenses: false,
    checkAllBids: false,
    description: '',
    distributionList: [],
    distribution_id: '',
    estimateDt: {
      description: '',
      distribution_id: '',
      estimate_no: ''
    }
  };

  constructor(
    private commonService: CommonService,
    public dialogRef: MatDialogRef<AddEstimateComponent>,
    private snackbar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data
  ) {

  }


  ngOnInit() {
    this.getProducts();
  }

  getProducts(): void {
    this.state.loader = true;
    if (this.data.type == 'edit') {
      forkJoin(
        this.commonService.getApi('estCstAnalysis', {
          jobs_id: this.data.job_id,
          estimate_id: this.data.estimate_id
        }),
        this.commonService.getApi('distributionsList', {
          jobs_id: this.data.job_id
        })
      ).subscribe(([response1, response2]) => {
        if (response1['result'] && response1['result'].success) {
          this.state.products = response1['result'].data.products;
          this.state.estimateDt = response1['result'].data.estimateDt;
        }
        if (response2['result'].success) {
          this.state.distributionList = response2['result'].data;
          if (this.state.distributionList.length && this.state.estimateDt.distribution_id == '') {
            this.state.estimateDt.distribution_id = this.state.distributionList[0].id;
          }
        }
        if (response1['result'].success && response2['result'].success) {
          this.state.loader = false;
          this.checkSelectAllProducts();
          this.checkSelectAllColumns('task');
          this.checkSelectAllColumns('expense');
          this.checkSelectAllColumns('bid');
        }
        setTimeout(() => {
          this.state.unlockCreateEstimate=false;
        }, 10); 
      });
    } else {
      forkJoin(
        this.commonService.saveApi('getVendorServicesBidDeadline', {
          job_id: this.data.job_id,
          estimate_id: this.data.estimate_id
        }),
        this.commonService.getApi('distributionsList', {
          jobs_id: this.data.job_id
        })
      ).subscribe(([response1, response2]) => {
        if (response1['result'] && response1['result'].success) {
          this.state.products = response1['result'].data.products
        }
        if (response2['result'].success) {
          this.state.distributionList = response2['result'].data;
          if (this.state.distributionList.length && this.state.estimateDt.distribution_id == '') {
            this.state.estimateDt.distribution_id = this.state.distributionList[0].id;
          }
        }
        if (response1['result'].success && response2['result'].success) {
          this.state.loader = false;
        }
        setTimeout(() => {
          this.state.unlockCreateEstimate = false;
        }, 10);
      });
    }
  }

  checkAllServices(item): void {
    if (item.services && item.services.length) {
      _.map(item.services, (value) => {
        value['selected'] = item.selected;
        ['task', 'expense', 'bid'].map(prop => {
          value[prop] = item.selected;
        })
      });
    }
    this.checkSelectAllProducts();
  }

  checkParentProduct(item, parent): void {
    if (item.selected) {
      parent['selected'] = true;
      ['task', 'expense', 'bid'].map(prop => {
        item[prop] = true;
      })
    } else {
      ['task', 'expense', 'bid'].map(prop => {
        item[prop] = false;
      })
      let parentChk = false;
      _.map(parent.services, (value) => {
        if (value['selected']) {
          parentChk = true;
        }
      });
      parent['selected'] = parentChk;
    }
    this.checkSelectAllProducts();
  }

  checkColumnLevel(item, type): void {
    if (!item[type]) {
      switch (type) {
        case 'task':
          this.state.checkAllTasks = false;
          break;
        case 'expense':
          this.state.checkAllExpenses = false;
          break;
        case 'bid':
          this.state.checkAllBids = false;
          break;
      }
    } else {
      let check = true;
      _.map(this.state.products, (value) => {
        if (value.services && value.services.length) {
          _.map(value.services, (child) => {
            if (!child[type]) {
              check = false;
            }
          });
        }
      });
      if (check) {
        switch (type) {
          case 'task':
            this.state.checkAllTasks = true;
            break;
          case 'expense':
            this.state.checkAllExpenses = true;
            break;
          case 'bid':
            this.state.checkAllBids = true;
            break;
        }
      }
    }
    this.checkSelectAllProducts();
  }

  checkSelectAllColumns(type): void {
    let uncheck = false;
    _.map(this.state.products, (value) => {
      if (value.services && value.services.length) {
        _.map(value.services, (child) => {
          if (!child[type]) {
            uncheck = true;
          }
        });
      }
    });
    if (uncheck) {
      switch (type) {
        case 'task':
          this.state.checkAllTasks = false;
          break;
        case 'expense':
          this.state.checkAllExpenses = false;
          break;
        case 'bid':
          this.state.checkAllBids = false;
          break;
      }
    } else {
      switch (type) {
        case 'task':
          this.state.checkAllTasks = true;
          break;
        case 'expense':
          this.state.checkAllExpenses = true;
          break;
        case 'bid':
          this.state.checkAllBids = true;
          break;
      }
    }
  }

  checkSelectAllProducts(): void {
    let uncheck = false;
    let selected = false;
    _.map(this.state.products, (value) => {
      if (!value['selected']) {
        uncheck = true;
      } else {
        selected = true;
      }
      if (value.services && value.services.length) {
        _.map(value.services, (child) => {
          if (!child['selected']) {
            uncheck = true;
          } else {
            selected = true;
          }
        });
      }
    });
    if (uncheck) {
      ['checkAllProducts', 'checkAllTasks', 'checkAllExpenses', 'checkAllBids'].map(prop => {
        this.state[prop] = false;
      })
    } else {
      ['checkAllProducts', 'checkAllTasks', 'checkAllExpenses', 'checkAllBids'].map(prop => {
        this.state[prop] = true;
      })
    }
    if (selected) {
      this.state.unlockCreateEstimate = true;
    } else {
      this.state.unlockCreateEstimate = false;
    }
  }

  checkAllTasks(status: any): void {
    let selected = false;
    _.map(this.state.products, (value) => {
      if (value.services && value.services.length) {
        _.map(value.services, (child) => {
          child['task'] = status;
          if (status) {
            selected = true;
          }
        });
      }
    });
    if (selected) {
      this.state.checkAllTasks = true;
    } else {
      this.state.checkAllTasks = false;
    }
    this.checkSelectAllProducts();
  }

  checkAllExpenses(status: any): void {
    let selected = false;
    _.map(this.state.products, (value) => {
      if (value.services && value.services.length) {
        _.map(value.services, (child) => {
          child['expense'] = status;
          if (status) {
            selected = true;
          }
        });
      }
    });
    if (selected) {
      this.state.checkAllExpenses = true;
    } else {
      this.state.checkAllExpenses = false;
    }
    this.checkSelectAllProducts();
  }

  checkAllBids(status: any): void {
    let selected = false;
    _.map(this.state.products, (value) => {
      if (value.services && value.services.length) {
        _.map(value.services, (child) => {
          child['bid'] = status;
          if (status) {
            selected = true;
          }
        });
      }
    });
    if (selected) {
      this.state.checkAllBids = true;
    } else {
      this.state.checkAllBids = false;
    }
    this.checkSelectAllProducts();
  }

  checkAllProducts(status: any): void {
    let selected = false;
    _.map(this.state.products, (value) => {
      value['selected'] = status;
      if (status) {
        selected = true;
      }
      if (value.services && value.services.length) {
        _.map(value.services, (child) => {
          child['selected'] = status;
          ['task', 'expense', 'bid'].map(prop => {
            child[prop] = status;
          })
          if (status) {
            selected = true;
          }
        });
      }
    });
    if (selected) {
      this.state.unlockCreateEstimate = true;
    } else {
      this.state.unlockCreateEstimate = false;
    }
    ['checkAllTasks', 'checkAllExpenses', 'checkAllBids'].map(prop => {
      this.state[prop] = status;
    })
  }

  estimateChange(): void {
    // this.state.unlockCreateEstimate = true;
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
  close(): void {
    this.dialogRef.close();
  }


  save(): void {
    this.state.unlockCreateEstimate = false;
    this.state.loader = true;
    let services = [];
    let tasks = [];
    let expenses = [];
    let bids = [];
    let uncheckedServices = [];
    let uncheckedTasks = [];
    let uncheckedExpenses = [];
    let uncheckedBids = [];

    _.map(this.state.products, (value) => {
      _.map(value.services, (child) => {
        if (child.selected) {
          services.push(child.job_service_revisions_id);
        } else {
          uncheckedServices.push(child.job_service_revisions_id);
        }
        if (child.task) {
          tasks.push(child.job_service_revisions_id);
        } else {
          uncheckedTasks.push(child.job_service_revisions_id);
        }
        if (child.expense) {
          expenses.push(child.job_service_revisions_id);
        } else {
          uncheckedExpenses.push(child.job_service_revisions_id);
        }
        if (child.bid) {
          bids.push(child.job_service_revisions_id);
        } else {
          uncheckedBids.push(child.job_service_revisions_id);
        }
      });
    });
    let estParams = {
      jobs_id: this.data.job_id,
      jsr_ids: services,
      tasks: tasks,
      expenses: expenses,
      bids: bids,
      description: this.state.estimateDt.description,
      distribution_id: this.state.estimateDt.distribution_id,
      uncheckedjsr_ids: uncheckedServices,
      uncheckedTasks: uncheckedTasks,
      uncheckedExpenses: uncheckedExpenses,
      uncheckedBids: uncheckedBids,
      id: this.data.estimate_id
    }
    if (this.data.is_revision) {
      estParams['estimate_revision'] = this.data.estimate.estimate_revision;
      estParams['estimate_count'] = this.data.estimate.estimate_count;
      estParams['is_revision'] = true;
    }
    if(this.data.estimate && this.data.estimate.status_id){
      estParams['status'] = this.data.estimate.status_id;
    }
    this.commonService.saveApi('createEstimate', estParams)
      .then(res => {
        if (res['result'] && res['result'].success) {
          this.dialogRef.close({ success: true, response: res['result'] });
          this.snackbar.openFromComponent(SnackbarComponent, {
            data: { status: 'success', msg: 'Estimate Added Successfully.' },
            verticalPosition: 'top',
            horizontalPosition: 'right'
          });
        }
        this.state.loader = false;
      }).catch(err => {
        this.state.loader = false;
      });
  }

}
