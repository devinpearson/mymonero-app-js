// Copyright (c) 2014-2017, MyMonero.com
//
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without modification, are
// permitted provided that the following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice, this list of
//	conditions and the following disclaimer.
//
// 2. Redistributions in binary form must reproduce the above copyright notice, this list
//	of conditions and the following disclaimer in the documentation and/or other
//	materials provided with the distribution.
//
// 3. Neither the name of the copyright holder nor the names of its contributors may be
//	used to endorse or promote products derived from this software without specific
//	prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
// EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
// MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL
// THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
// PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
// INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
// STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF
// THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
"use strict"
//
const View = require('../../Views/View.web')
const commonComponents_tables = require('../../WalletAppCommonComponents/tables.web')
const commonComponents_navigationBarButtons = require('../../WalletAppCommonComponents/navigationBarButtons.web')
//
class TransactionDetailsView extends View
{
	constructor(options, context)
	{
		super(options, context)
		//
		const self = this
		{
			self.transaction = options.transaction
			if (self.transaction === null || typeof self.transaction === 'undefined') {
				throw "options.transaction nil but required for " + self.constructor.name
				return
			}
			//
			self.wallet = options.wallet
			if (self.wallet === null || typeof self.wallet === 'undefined') {
				throw "options.wallet nil but required for " + self.constructor.name
				return
			}
		}
		self.setup()
	}
	setup()
	{
		const self = this
		{ // zeroing / initialization
		}
		self._setup_views()
		self._setup_startObserving()
		//
		self._configureUIWithTransaction()
	}
	_setup_views()
	{
		const self = this
		//
		self.layer.style.webkitUserSelect = "none" // disable selection here but enable selectively
		//
		self.layer.style.width = "calc(100% - 20px)"
		self.layer.style.height = "100%" // we're also set height in viewWillAppear when in a nav controller
		//
		self.layer.style.backgroundColor = "#282527" // so we don't get a strange effect when pushing self on a stack nav view
		//
		self.layer.style.color = "#c0c0c0" // temporary
		//
		self.layer.style.overflowY = "scroll"
		self.layer.style.padding = "0 10px 40px 10px" // actually going to change paddingTop in self.viewWillAppear() if navigation controller
		//
		self.layer.style.wordBreak = "break-all" // to get the text to wrap
	}
	_setup_startObserving()
	{
		const self = this
		self._setup_startObserving_wallet()
	}
	_setup_startObserving_wallet()
	{
		const self = this
		if (typeof self.wallet === 'undefined' || self.wallet === null) {
			throw "nil self.wallet undefined in " + self.constructor.name + "/" + "_setup_startObserving_wallet`"
			return
		}
		// here, we're going to store the listener functions as instance properties
		// because when we need to stopObserving we need to have access to the listener fns
		//
		// txs updated
		self.wallet_EventName_transactionsChanged_listenerFunction = function()
		{
			self.wallet_EventName_transactionsChanged()
		}
		self.wallet.on(
			self.wallet.EventName_transactionsChanged(),
			self.wallet_EventName_transactionsChanged_listenerFunction
		)
	}
	//
	//
	// Lifecycle - Teardown
	//
	TearDown()
	{ // We're going to make sure we tear this down here as well as in VDA in case we get popped over back to root (thus never calling VDA but calling this)
		const self = this
		super.TearDown()
		//
		self.transaction = null
		self._stopObserving()
		self.wallet = null
	}
	_stopObserving()
	{
		const self = this
		function doesListenerFunctionExist(fn)
		{
			if (typeof fn !== 'undefined' && fn !== null) {
				return true
			}
			return false
		}
		if (doesListenerFunctionExist(self.wallet_EventName_transactionsChanged_listenerFunction) === true) {
			self.wallet.removeListener(
				self.wallet.EventName_transactionsChanged(),
				self.wallet_EventName_transactionsChanged_listenerFunction
			)
		}
	}
	//
	//
	// Runtime - Accessors - Navigation
	//
	Navigation_Title()
	{
		const self = this
		const transaction = self.transaction
		//
		return transaction.approx_float_amount || ""
	}

	Navigation_New_RightBarButtonView()
	{
		const self = this
		const view = commonComponents_navigationBarButtons.New_RightSide_ValueDisplayLabelButtonView(self.context)
		const layer = view.layer
		{
			var valueString;
			const transaction = self.transaction
			if (transaction && typeof transaction !== 'undefined') {
				if (transaction.isConfirmed !== true) {
					valueString = "PENDING"
				} else {
					valueString = "CONFIRMED"
				}
			} else {
				valueString = ""
			}
			layer.innerHTML = valueString
		}
		{ // observe
			view.layer.addEventListener(
				"click",
				function(e)
				{
					e.preventDefault()
					// disabled
					return false
				}
			)
		}
		return view
	}
	
	Navigation_TitleColor()
	{
		const self = this
		const transaction = self.transaction
		const colorHexString_orNil = transaction.approx_float_amount < 0 ? "red" : null
		//
		return colorHexString_orNil // null meaning go with the default
	}
	//
	//
	// Internal - Runtime - Accessors - Child elements - Metrics
	//
	//
	_idPrefix()
	{
		const self = this
		//
		return self.constructor.name + "_" + self.View_UUID()
	}
	//
	//
	// Runtime - Imperatives - UI Configuration
	//
	_configureUIWithTransaction()
	{
		const self = this
		const wallet = self.wallet
		if (wallet.didFailToInitialize_flag === true || wallet.didFailToBoot_flag === true) {
			throw self.constructor.name + " opened while wallet failed to init or boot."
			return
		}
		const transaction = self.transaction
		{ // clear layer children
			while (self.layer.firstChild) {
			    self.layer.removeChild(self.layer.firstChild)
			}
			self.tableSection_containerLayer = null // was just removed; free
		}
		{ // messages/alerts
			if (transaction.isUnlocked !== true) {
				const lockedReason = self.wallet.TransactionLockedReason(self.transaction)
				var messageString = "This transaction is currently locked. " + lockedReason
				const layer = commonComponents_tables.New_inlineMessageDialogLayer(messageString, true)
				self.layer.appendChild(layer)
			}
		}
		{
			if (transaction.isJustSentTransaction === true) {
				const messageString = "Your Monero is on its way."
				const layer = commonComponents_tables.New_inlineMessageDialogLayer(messageString, true)
				self.layer.appendChild(layer)
			}
			if (self.navigationController) {
				self.navigationController.SetNavigationBarTitleNeedsUpdate() // for the CONFIRMED/PENDING
			} else {
				// then it'll effectively be called for us after init
			}
		}
		const containerLayer = document.createElement("div")
		{
			containerLayer.style.border = "1px solid #888"
			containerLayer.style.borderRadius = "5px"
		}
		self.tableSection_containerLayer = containerLayer
		{
			self._addTableFieldLayer_date()
			containerLayer.appendChild(commonComponents_tables.New_separatorLayer())
			self._addTableFieldLayer_amount()
			containerLayer.appendChild(commonComponents_tables.New_separatorLayer())
			self._addTableFieldLayer_mixin()
			containerLayer.appendChild(commonComponents_tables.New_separatorLayer())
			self._addTableFieldLayer_transactionHash()
			containerLayer.appendChild(commonComponents_tables.New_separatorLayer())
			self._addTableFieldLayer_paymentID()
		}
		self.layer.appendChild(containerLayer)
		// self.DEBUG_BorderChildLayers()
	}
	_addTableFieldLayer_date()
	{
		const self = this
		const div = commonComponents_tables.New_fieldContainerLayer()
		{
			const labelLayer = commonComponents_tables.New_fieldTitle_labelLayer("Date")
			div.appendChild(labelLayer)
			//
			const valueLayer = commonComponents_tables.New_fieldValue_labelLayer(self.transaction.timestamp.toString()) // TODO: format
			div.appendChild(valueLayer)
		}
		div.appendChild(commonComponents_tables.New_clearingBreakLayer()) // preserve height; better way?
		self.tableSection_containerLayer.appendChild(div)
	}
	_addTableFieldLayer_amount()
	{
		const self = this
		const div = commonComponents_tables.New_fieldContainerLayer()
		{
			const labelLayer = commonComponents_tables.New_fieldTitle_labelLayer("Amount")
			div.appendChild(labelLayer)
			//
			const value = self.transaction.approx_float_amount
			const valueLayer = commonComponents_tables.New_fieldValue_labelLayer("" + value)
			{
				if (value < 0) {
					valueLayer.style.color = "red"
				} else {
					valueLayer.style.color = "#aaa"
				}
				//
				// valueLayer.style.webkitUserSelect = "all" // commenting for now
			}					
			div.appendChild(valueLayer)
		}
		div.appendChild(commonComponents_tables.New_clearingBreakLayer()) // preserve height; better way?
		self.tableSection_containerLayer.appendChild(div)
	}
	_addTableFieldLayer_mixin()
	{
		const self = this
		const div = commonComponents_tables.New_fieldContainerLayer()
		{
			const labelLayer = commonComponents_tables.New_fieldTitle_labelLayer("Mixin")
			div.appendChild(labelLayer)
			//
			const value = self.transaction.mixin
			const valueLayer = commonComponents_tables.New_fieldValue_labelLayer("" + value)
			div.appendChild(valueLayer)
		}
		div.appendChild(commonComponents_tables.New_clearingBreakLayer()) // preserve height; better way?
		self.tableSection_containerLayer.appendChild(div)
	}
	_addTableFieldLayer_transactionHash()
	{
		const self = this
		const fieldLabelTitle = "Transaction Hash"
		const value = self.transaction.hash
		const valueToDisplayIfValueNil = "N/A"
		const div = commonComponents_tables.New_copyable_longStringValueField_component_fieldContainerLayer(
			fieldLabelTitle, 
			value,
			self.context.pasteboard, 
			valueToDisplayIfValueNil
		)
		self.tableSection_containerLayer.appendChild(div)
	}
	_addTableFieldLayer_paymentID()
	{
		const self = this
		const fieldLabelTitle = "Payment ID"
		const value = self.transaction.payment_id
		const valueToDisplayIfValueNil = "N/A"
		const div = commonComponents_tables.New_copyable_longStringValueField_component_fieldContainerLayer(
			fieldLabelTitle, 
			value,
			self.context.pasteboard, 
			valueToDisplayIfValueNil
		)
		self.tableSection_containerLayer.appendChild(div)
	}
	//
	//
	// Runtime - Delegation - Event handlers - Wallet
	//
	wallet_EventName_transactionsChanged()
	{
		const self = this
		var updated_transaction = null // to find
		const transactions = self.wallet.New_StateCachedTransactions() // important to use this instead of .transactions
		const transactions_length = transactions.length
		for (let i = 0 ; i < transactions_length ; i++) {
			const this_transaction = transactions[i]
			if (this_transaction.hash === self.transaction.hash) {
				updated_transaction = this_transaction
				break
			}
		}
		if (updated_transaction !== null) {
			self.transaction = updated_transaction
			if (typeof self.navigationController !== 'undefined' && self.navigationController !== null) {
				self.navigationController.SetNavigationBarTitleNeedsUpdate()
			}
			self._configureUIWithTransaction() // updated - it might not be this one which updated but (a) it's quite possible and (b) configuring the UI isn't too expensive
		} else {
			throw "Didn't find same transaction in already open details view. Probably a server bug."
		}
	}
	//
	//
	// Runtime - Delegation - Navigation/View lifecycle
	//
	viewWillAppear()
	{
		const self = this
		super.viewWillAppear()
		{
			if (typeof self.navigationController !== 'undefined' && self.navigationController !== null) {
				self.layer.style.paddingTop = `${self.navigationController.NavigationBarHeight()}px`
				self.layer.style.height = `calc(100% - ${self.navigationController.NavigationBarHeight()}px)`
			}
		}
	}
	viewDidAppear()
	{
		const self = this
		super.viewDidAppear()
	}
}
module.exports = TransactionDetailsView
