package main

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

const (
	landPrefix      = "land:"
	parcelIndex     = "parcel"
	titleIndex      = "title"
	governmentMSP   = "GovernmentOrgMSP"
	citizenMSP      = "CitizenOrgMSP"
	feeBasisPoints  = int64(500)
	basisPointDenom = int64(10_000)
)

type LandContract struct{ contractapi.Contract }

type LandAsset struct {
	PropertyID          string       `json:"propertyId"`
	ParcelNumber        string       `json:"parcelNumber"`
	TitleNumber         string       `json:"titleNumber"`
	OwnerNINRef         string       `json:"ownerNinRef"`
	OwnerName           string       `json:"ownerName"`
	OwnerMSP            string       `json:"ownerMsp"`
	State               string       `json:"state"`
	LGA                 string       `json:"lga"`
	Address             string       `json:"address"`
	Latitude            float64      `json:"latitude"`
	Longitude           float64      `json:"longitude"`
	SizeSqM             float64      `json:"sizeSqM"`
	AssessedValueKobo   int64        `json:"assessedValueKobo"`
	AskingPriceKobo     int64        `json:"askingPriceKobo"`
	OutstandingLevyKobo int64        `json:"outstandingLevyKobo"`
	DocumentCID         string       `json:"documentCid"`
	DocumentName        string       `json:"documentName"`
	Status              string       `json:"status"`
	ListedForSale       bool         `json:"listedForSale"`
	BillHistory         []BillRecord `json:"billHistory"`
	CreatedAt           string       `json:"createdAt"`
	UpdatedAt           string       `json:"updatedAt"`
	Version             int          `json:"version"`
}

type BillRecord struct {
	AmountKobo int64  `json:"amountKobo"`
	UpdatedBy  string `json:"updatedBy"`
	UpdatedAt  string `json:"updatedAt"`
}

type SettlementAllocation struct {
	PropertyID         string `json:"propertyId"`
	TransactionID      string `json:"transactionId"`
	PriceKobo          int64  `json:"priceKobo"`
	GovernmentFeeKobo  int64  `json:"governmentFeeKobo"`
	SellerProceedsKobo int64  `json:"sellerProceedsKobo"`
	Status             string `json:"status"`
	Detail             string `json:"detail"`
}

type LandTransferredEvent struct {
	PropertyID    string `json:"propertyId"`
	TransactionID string `json:"transactionId"`
	FromOwner     string `json:"fromOwner"`
	ToOwner       string `json:"toOwner"`
	Timestamp     string `json:"timestamp"`
}

type HistoryEntry struct {
	TxID      string `json:"txId"`
	Timestamp string `json:"timestamp"`
	IsDelete  bool   `json:"isDelete"`
	Value     string `json:"value"`
}

func (c *LandContract) RegisterLand(ctx contractapi.TransactionContextInterface, propertyID, parcelNumber, titleNumber, state, lga, address string, latitude, longitude, sizeSqM float64, assessedValueKobo int64) (*LandAsset, error) {
	if propertyID == "" || parcelNumber == "" || titleNumber == "" { return nil, fmt.Errorf("propertyId, parcelNumber, and titleNumber are required") }
	if sizeSqM <= 0 || assessedValueKobo < 0 { return nil, fmt.Errorf("invalid parcel size or assessed value") }
	ninRef, fullName, mspID, err := caller(ctx, true); if err != nil { return nil, err }
	if mspID != citizenMSP { return nil, fmt.Errorf("only CitizenOrgMSP may register citizen-owned land") }
	if exists, err := c.keyExists(ctx, landKey(propertyID)); err != nil { return nil, err } else if exists { return nil, fmt.Errorf("propertyId %s already exists", propertyID) }
	for _, index := range []struct{name, value string}{{parcelIndex, parcelNumber}, {titleIndex, titleNumber}} {
		key, err := ctx.GetStub().CreateCompositeKey(index.name, []string{index.value}); if err != nil { return nil, err }
		if exists, err := c.keyExists(ctx, key); err != nil { return nil, err } else if exists { return nil, fmt.Errorf("%s %s already exists", index.name, index.value) }
	}
	timestamp, err := txTimestamp(ctx); if err != nil { return nil, err }
	asset := &LandAsset{PropertyID: propertyID, ParcelNumber: parcelNumber, TitleNumber: titleNumber, OwnerNINRef: ninRef, OwnerName: fullName, OwnerMSP: mspID, State: state, LGA: lga, Address: address, Latitude: latitude, Longitude: longitude, SizeSqM: sizeSqM, AssessedValueKobo: assessedValueKobo, Status: "REGISTERED", BillHistory: []BillRecord{}, CreatedAt: timestamp, UpdatedAt: timestamp, Version: 1}
	return asset, c.putAsset(ctx, asset)
}

func (c *LandContract) ReadLand(ctx contractapi.TransactionContextInterface, propertyID string) (*LandAsset, error) {
	bytes, err := ctx.GetStub().GetState(landKey(propertyID)); if err != nil { return nil, err }; if len(bytes) == 0 { return nil, fmt.Errorf("property %s does not exist", propertyID) }
	var asset LandAsset; if err := json.Unmarshal(bytes, &asset); err != nil { return nil, err }; return &asset, nil
}

func (c *LandContract) QueryProperty(ctx contractapi.TransactionContextInterface, propertyID string) (*LandAsset, error) { return c.ReadLand(ctx, propertyID) }

func (c *LandContract) GetAllLands(ctx contractapi.TransactionContextInterface) ([]*LandAsset, error) {
	iterator, err := ctx.GetStub().GetStateByRange(landPrefix, "land;"); if err != nil { return nil, err }; defer iterator.Close()
	assets := make([]*LandAsset, 0); for iterator.HasNext() { entry, err := iterator.Next(); if err != nil { return nil, err }; var asset LandAsset; if err := json.Unmarshal(entry.Value, &asset); err != nil { return nil, err }; assets = append(assets, &asset) }; return assets, nil
}

func (c *LandContract) GetLandHistory(ctx contractapi.TransactionContextInterface, propertyID string) ([]HistoryEntry, error) {
	iterator, err := ctx.GetStub().GetHistoryForKey(landKey(propertyID)); if err != nil { return nil, err }; defer iterator.Close(); history := make([]HistoryEntry, 0)
	for iterator.HasNext() { entry, err := iterator.Next(); if err != nil { return nil, err }; timestamp := ""; if entry.Timestamp != nil { timestamp = time.Unix(entry.Timestamp.Seconds, int64(entry.Timestamp.Nanos)).UTC().Format(time.RFC3339) }; history = append(history, HistoryEntry{TxID: entry.TxId, Timestamp: timestamp, IsDelete: entry.IsDelete, Value: string(entry.Value)}) }; return history, nil
}

func (c *LandContract) ListPropertyForSale(ctx contractapi.TransactionContextInterface, propertyID string, askingPriceKobo int64) (*LandAsset, error) {
	asset, err := c.ReadLand(ctx, propertyID); if err != nil { return nil, err }; if askingPriceKobo <= 0 { return nil, fmt.Errorf("asking price must be positive") }; if err := c.requireOwner(ctx, asset); err != nil { return nil, err }
	asset.AskingPriceKobo, asset.ListedForSale, asset.Version = askingPriceKobo, true, asset.Version+1; asset.UpdatedAt, err = txTimestamp(ctx); if err != nil { return nil, err }; return asset, c.putAsset(ctx, asset)
}

func (c *LandContract) CancelPropertyListing(ctx contractapi.TransactionContextInterface, propertyID string) (*LandAsset, error) {
	asset, err := c.ReadLand(ctx, propertyID); if err != nil { return nil, err }; if err := c.requireOwner(ctx, asset); err != nil { return nil, err }
	asset.AskingPriceKobo, asset.ListedForSale, asset.Version = 0, false, asset.Version+1; asset.UpdatedAt, err = txTimestamp(ctx); if err != nil { return nil, err }; return asset, c.putAsset(ctx, asset)
}

func (c *LandContract) InitiatePurchase(ctx contractapi.TransactionContextInterface, propertyID string) (*SettlementAllocation, error) {
	asset, err := c.ReadLand(ctx, propertyID); if err != nil { return nil, err }; buyerNINRef, buyerName, buyerMSP, err := caller(ctx, true); if err != nil { return nil, err }
	if buyerMSP != citizenMSP { return nil, fmt.Errorf("only CitizenOrgMSP identities may purchase land") }; if !asset.ListedForSale { return nil, fmt.Errorf("property %s is not listed for sale", propertyID) }; if asset.OwnerNINRef == buyerNINRef { return nil, fmt.Errorf("the current owner cannot purchase the same property") }; if asset.OutstandingLevyKobo > 0 { return nil, fmt.Errorf("property has outstanding levy of %d kobo", asset.OutstandingLevyKobo) }
	price := asset.AskingPriceKobo; fee := price * feeBasisPoints / basisPointDenom; seller := asset.OwnerName; transactionID := ctx.GetStub().GetTxID(); timestamp, err := txTimestamp(ctx); if err != nil { return nil, err }
	asset.OwnerNINRef, asset.OwnerName, asset.OwnerMSP, asset.AskingPriceKobo, asset.ListedForSale, asset.Status, asset.Version, asset.UpdatedAt = buyerNINRef, buyerName, buyerMSP, 0, false, "TRANSFERRED", asset.Version+1, timestamp
	if err := c.putAsset(ctx, asset); err != nil { return nil, err }
	eventBytes, _ := json.Marshal(LandTransferredEvent{PropertyID: propertyID, TransactionID: transactionID, FromOwner: seller, ToOwner: buyerName, Timestamp: timestamp}); if err := ctx.GetStub().SetEvent("LandTransferred", eventBytes); err != nil { return nil, err }
	return &SettlementAllocation{PropertyID: propertyID, TransactionID: transactionID, PriceKobo: price, GovernmentFeeKobo: fee, SellerProceedsKobo: price - fee, Status: "SIMULATED", Detail: "SIMULATED — NO FUNDS MOVED"}, nil
}

func (c *LandContract) UpdateBillHistory(ctx contractapi.TransactionContextInterface, propertyID string, levyKobo int64) (*LandAsset, error) {
	if levyKobo < 0 { return nil, fmt.Errorf("levy cannot be negative") }; _, _, mspID, err := caller(ctx, true); if err != nil { return nil, err }; if mspID != governmentMSP { return nil, fmt.Errorf("only GovernmentOrgMSP may update bill history") }
	asset, err := c.ReadLand(ctx, propertyID); if err != nil { return nil, err }; timestamp, err := txTimestamp(ctx); if err != nil { return nil, err }; asset.OutstandingLevyKobo, asset.BillHistory, asset.Version, asset.UpdatedAt = levyKobo, append(asset.BillHistory, BillRecord{AmountKobo: levyKobo, UpdatedBy: mspID, UpdatedAt: timestamp}), asset.Version+1, timestamp; return asset, c.putAsset(ctx, asset)
}

func (c *LandContract) VerifyDocumentCID(ctx contractapi.TransactionContextInterface, propertyID, candidateCID string) (string, error) { asset, err := c.ReadLand(ctx, propertyID); if err != nil { return "", err }; if candidateCID != "" && asset.DocumentCID != "" && candidateCID == asset.DocumentCID { return "MATCH", nil }; return "MISMATCH", nil }

func (c *LandContract) GetUserProperties(ctx contractapi.TransactionContextInterface) ([]*LandAsset, error) {
	ninRef, _, _, err := caller(ctx, false); if err != nil { return nil, err }; assets, err := c.GetAllLands(ctx); if err != nil { return nil, err }; owned := make([]*LandAsset, 0); for _, asset := range assets { if asset.OwnerNINRef == ninRef { owned = append(owned, asset) } }; return owned, nil
}

func (c *LandContract) keyExists(ctx contractapi.TransactionContextInterface, key string) (bool, error) { bytes, err := ctx.GetStub().GetState(key); return len(bytes) > 0, err }

func (c *LandContract) putAsset(ctx contractapi.TransactionContextInterface, asset *LandAsset) error {
	bytes, err := json.Marshal(asset); if err != nil { return err }; if err := ctx.GetStub().PutState(landKey(asset.PropertyID), bytes); err != nil { return err }
	for _, index := range []struct{name, value string}{{parcelIndex, asset.ParcelNumber}, {titleIndex, asset.TitleNumber}} { key, err := ctx.GetStub().CreateCompositeKey(index.name, []string{index.value}); if err != nil { return err }; if err := ctx.GetStub().PutState(key, []byte(asset.PropertyID)); err != nil { return err } }; return nil
}

func (c *LandContract) requireOwner(ctx contractapi.TransactionContextInterface, asset *LandAsset) error { ninRef, _, mspID, err := caller(ctx, true); if err != nil { return err }; if ninRef != asset.OwnerNINRef || mspID != asset.OwnerMSP { return fmt.Errorf("submitting identity is not the current owner") }; return nil }

func caller(ctx contractapi.TransactionContextInterface, requireActive bool) (string, string, string, error) {
	identity := ctx.GetClientIdentity(); ninRef, found, err := identity.GetAttributeValue("ninRef"); if err != nil || !found || strings.TrimSpace(ninRef) == "" { return "", "", "", fmt.Errorf("certificate attribute ninRef is required") }
	fullName, found, err := identity.GetAttributeValue("fullName"); if err != nil || !found || strings.TrimSpace(fullName) == "" { return "", "", "", fmt.Errorf("certificate attribute fullName is required") }
	if requireActive { status, found, err := identity.GetAttributeValue("ninStatus"); if err != nil || !found || status != "ACTIVE" { return "", "", "", fmt.Errorf("certificate attribute ninStatus must be ACTIVE") } }
	mspID, err := identity.GetMSPID(); return ninRef, fullName, mspID, err
}

func txTimestamp(ctx contractapi.TransactionContextInterface) (string, error) { timestamp, err := ctx.GetStub().GetTxTimestamp(); if err != nil { return "", err }; if timestamp == nil { return "", fmt.Errorf("transaction timestamp is missing") }; return time.Unix(timestamp.Seconds, int64(timestamp.Nanos)).UTC().Format(time.RFC3339), nil }
func landKey(propertyID string) string { return landPrefix + propertyID }
