// Copyright 2021 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.



// {"report_id":"RJOxr9R","bucket_path":"gs://smart-expenses-parsed-receipts/"}

const {Storage} = require('@google-cloud/storage');
const storage = new Storage();

const Firestore = require('@google-cloud/firestore');

exports.processAnnotations = async (req, res) => {
  const {report_id, bucket_path} = req.body;

  console.log("Report", report_id);
  console.log("Bucket", bucket_path);

  const query = {
    prefix: report_id,
  };
  const [files] = await storage.bucket(bucket_path).getFiles(query);

  const allSummaries = [];

  for await (const fileInfo of files) {
    var summary = new Map();

    console.log("Analysing", fileInfo.name);
    const [file] = await fileInfo.download();
    const {entities} = JSON.parse(file.toString());

    var errorMsg = "";
    try {
      const supplier = entities.find(e => e.type == 'supplier_name')?.normalizedValue?.text;
      if (!!supplier) summary.set('supplier', supplier);
      console.log("Supplier", supplier);
    } catch(e) { console.error(e); errorMsg += e.message + "\n"; }

    try {
      const lineItems = entities.filter(e => e.type == 'line_item').map(li => li?.normalizedValue?.text).filter(li => !!li);
      summary.set('lineItems', lineItems);
    } catch(e) { console.error(e); errorMsg += e.message + "\n"; }

    try {
      const total = entities.find(e => e.type == 'total_amount')?.normalizedValue?.text;
      if (!!total) summary.set('total', total);
    } catch(e) { console.error(e); errorMsg += e.message + "\n"; }
    
    try {
      const currency = entities.find(e => e.type == 'currency')?.normalizedValue?.text;
      if (!!currency) summary.set('currency', currency);
    } catch(e) { console.error(e); errorMsg += e.message + "\n"; }

    const summaryObject = Object.fromEntries(summary);
    console.log(`SUMMARY (${fileInfo.name})`, summaryObject);
    allSummaries.push({file: fileInfo.name, summary: summaryObject});
  };

  const requestStore = new Firestore().collection('requests');
  const doc = requestStore.doc(report_id);
  await doc.set({
      summary: allSummaries
  }, {merge: true});

  if (errorMsg.length > 0) {
    res.send({
      status: 'Error',
      summary: allSummaries,
      message: errorMsg
    });
  } else {
    res.send({
      status: 'OK',
      summary: allSummaries
    });
  }
};