import { DatePipe } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormControl } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { duration } from "moment";
import { CustomDialogComponent } from "src/app/components/dialog/custom-dialog";
import { AdminService } from "src/app/services/admin.service";

interface Profile {
  display_strings: string;
  profiles: [];
  account_name: string;
  banned_global: boolean;
  banned_ffa: boolean;
  banned_team: boolean;
  banned_chat: boolean;
  banned_kickvote: boolean;
  banned_msgvote: boolean;
  global_name: string;
  last_name: string;
  join_date: string;
  creation_date: string;
  level: string;
  balance: string;
  language: string;
  admin_eligible: string;
  ip_address: string;
  device_uuid: string;
  last_join: string;
  kicked_count: string;
  banned_count_global: string;
  banned_count_ffa: string;
  banned_count_team: string;
  banned_count_chat: string;
  banned_count_kvote: string;
  banned_count_mvote: string;
}
interface Profiles {
  [key: string]: Profile;
}
interface AccountInfo {
  extra: string;
  banned_global: boolean;
  banned_ffa: boolean;
  banned_team: boolean;
  banned_chat: boolean;
  banned_kickvote: boolean;
  banned_msgvote: boolean;
}
interface RestrictionMap {
  [key: string]: AccountInfo;
}
@Component({
  selector: "app-players-profile",
  templateUrl: "./players-profile.component.html",
  styleUrls: ["./players-profile.component.scss"],
  providers: [DatePipe],
})
export class PlayersProfileComponent implements OnInit {
  searchKeyControl: FormControl = new FormControl();
  selectDBControl: FormControl = new FormControl();
  restrictionMap: RestrictionMap = {};
  updateInQueue: string[] = [];
  constructor(
    private adminService: AdminService,
    private dialog: MatDialog,
    private datePipe: DatePipe
  ) {}

  ngOnInit() {
    this.adminService.getDBs("players").subscribe((data) => {
      this.DBS = data as [];
      this.selectDBControl.setValue(this.DBS[0]);
    });
  }
  PROFILES: Profiles = {};
  DBS: string[] = [];

  getObjectKeys(obj: any): string[] {
    return Object.keys(obj);
  }
  onBanClick(account_id: string) {
    if (this.restrictionMap[account_id].banned_global)
      this.openDialog("unban", account_id, this.needDuration("unban"));
    else this.openDialog("ban", account_id, this.needDuration("ban"));
  }
  onUnmuteClick(account_id: string) {
    if (this.restrictionMap[account_id].banned_chat)
      this.openDialog("unmute", account_id, this.needDuration("unmute"));
    else this.openDialog("mute", account_id, this.needDuration("mute"));
  }
  onKickVoteClick(account_id: string) {
    if (this.restrictionMap[account_id].banned_kickvote)
      this.openDialog(
        "enable-kick-vote",
        account_id,
        this.needDuration("enable-kick-vote")
      );
    else
      this.openDialog(
        "disable-kick-vote",
        account_id,
        this.needDuration("disable-kick-vote")
      );
  }
  onSearch(event: Event) {
    if (
      (event instanceof KeyboardEvent && event.key === "Enter") ||
      event instanceof FocusEvent
    ) {
      this.adminService
        .searchPlayer(this.searchKeyControl.value, this.selectDBControl.value)
        .subscribe((data) => {
          this.PROFILES = data as Profiles;
        });
    }
  }

  getRestrictionInfo(account_id: string): AccountInfo {
    return this.restrictionMap[account_id];
  }

  onOpen(account_id: string) {
    this.adminService.getAccountInfo(account_id).subscribe((data) => {
      this.restrictionMap[account_id] = data as AccountInfo;
      this.updateInQueue = this.updateInQueue.filter(
        (item) => item !== account_id
      );
    });
  }

  openDialog(
    action: string,
    account_id: string,
    requriedDuration: boolean
  ): void {
    const dialogRef = this.dialog.open(CustomDialogComponent, {
      data: { type: action, account: account_id, requriedDuration },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result || !requriedDuration) {
        // duration wont be there for unban , unmute , enable kick vote
        this.updateInQueue.push(account_id);
        this.adminService
          .updatePlayer(
            action,
            account_id,
            requriedDuration ? Number(result.duration) : 0
          )
          .subscribe(() => {
            this.onOpen(account_id);
          });
      }
    });
  }

  needDuration(type: string) {
    return ["ban", "mute", "disable-kick-vote"].includes(type);
  }
  getDateTime(timestamp: number) {
    if (timestamp == undefined) return "-";

    return this.datePipe.transform(
      new Date(timestamp * 1000),
      "yyyy-MM-dd HH:mm:ss"
    );
  }
}
