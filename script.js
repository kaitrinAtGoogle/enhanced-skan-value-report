// Copyright 2022, Google Inc. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
 
/**
 * @name SKAN Report
 *
 * @overview Writes all SKAN data for a given account into a Spreadsheet.
 *
 */
 
// TODO: Replace SPREADSHEET_URL with the URL of the copy of the following spreadsheet:
// https://docs.google.com/spreadsheets/d/1XvN-vgkWpiYfmq1WD3RhL0M6KM4cVOTYYfxjsGk-lB0/copy?usp=sharing&resourcekey=0-CB6E3AJm2fD5y8LfD26VgQ
var SPREADSHEET_URL = "REPLACE_ME";
 
// TODO: Replace START_DATE with the preferred start date of the report.
var START_DATE = "2022-02-01";
 
var IS_MCC = isMccAccount();
 
function main() {
  var spreadsheet = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
  var dataArr = [];
  
  if (IS_MCC) {
    // Retrieve all children accounts.
    var accountIterator = AdsManagerApp.accounts().get();
 
    while (accountIterator.hasNext()) {
      var account = accountIterator.next();
      AdsManagerApp.select(account);
      dataArr = dataArr.concat(processAccount(account));
    }
  }
  else {
    dataArr = dataArr.concat(processAccount(AdsApp.currentAccount()));
  }
  
  logDataToSpreadsheet(spreadsheet, dataArr);
}
 
function processAccount(account, spreadsheet) {
	var accountId = account.getCustomerId();
  var todaysDate = new Date().toISOString().slice(0, 10);
  
	var queryResult = AdsApp.search(
		'SELECT segments.date, campaign.id, ' +
		'campaign.name, ' +
		'segments.sk_ad_network_conversion_value, ' +
		'metrics.sk_ad_network_conversions ' +
		'FROM campaign ' +
    "WHERE segments.date >= '" + START_DATE + "' "  + "AND segments.date <= '" + todaysDate + "' " +
		'ORDER BY campaign.id, segments.sk_ad_network_conversion_value '
	);
  
  var accountDataArr = [];
	while (queryResult.hasNext()) {
		var row = queryResult.next();
    var date = row.segments.date;
		var campaignId = row.campaign.id;
		var skadBit = row.segments.skAdNetworkConversionValue;
		var numConversions = row.metrics.skAdNetworkConversions;
		Logger.log("Date: %s, Campaign ID: %s - SKAdNetwork Bit: %s - # Conversions: %s", date, campaignId, skadBit, numConversions);
	  
    if (skadBit != "" && skadBit != null) {
      accountDataArr.push([date, accountId, campaignId, skadBit, numConversions]);
    }
  }
  
  if (accountDataArr.length > 0) {
    Logger.log(accountDataArr);
  }
  
  return accountDataArr;
}
 
function isMccAccount() {
 try {
    AdsManagerApp.accounts().get();
    return true;
 }
 catch {
   return false;
 }
}
 
function logDataToSpreadsheet(spreadsheet, dataArr) {
  var dataSheet = spreadsheet.getSheetByName('Data');
  dataSheet.getRange("A2:E" + dataSheet.getLastRow()).clear();
  var dataRange = dataSheet.getRange(2, 1, dataArr.length, 5);
  dataRange.setValues(dataArr);
}