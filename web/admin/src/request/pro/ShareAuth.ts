/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

import httpRequest, { ContentType, RequestParams } from "./httpClient";
import {
  DomainResponse,
  GithubComChaitinPandaWikiProApiShareV1AuthDingTalkReq,
  GithubComChaitinPandaWikiProApiShareV1AuthDingTalkResp,
  GithubComChaitinPandaWikiProApiShareV1AuthFeishuReq,
  GithubComChaitinPandaWikiProApiShareV1AuthFeishuResp,
} from "./types";

/**
 * @description 钉钉登录
 *
 * @tags ShareAuth
 * @name PostShareProV1AuthDingtalk
 * @summary 钉钉登录
 * @request POST:/share/pro/v1/auth/dingtalk
 * @response `200` `(DomainResponse & {
    data?: GithubComChaitinPandaWikiProApiShareV1AuthDingTalkResp,

})` OK
 */

export const postShareProV1AuthDingtalk = (
  param: GithubComChaitinPandaWikiProApiShareV1AuthDingTalkReq,
  params: RequestParams = {},
) =>
  httpRequest<
    DomainResponse & {
      data?: GithubComChaitinPandaWikiProApiShareV1AuthDingTalkResp;
    }
  >({
    path: `/share/pro/v1/auth/dingtalk`,
    method: "POST",
    body: param,
    type: ContentType.Json,
    format: "json",
    ...params,
  });

/**
 * @description 飞书登录
 *
 * @tags ShareAuth
 * @name PostShareProV1AuthFeishu
 * @summary 飞书登录
 * @request POST:/share/pro/v1/auth/feishu
 * @response `200` `(DomainResponse & {
    data?: GithubComChaitinPandaWikiProApiShareV1AuthFeishuResp,

})` OK
 */

export const postShareProV1AuthFeishu = (
  param: GithubComChaitinPandaWikiProApiShareV1AuthFeishuReq,
  params: RequestParams = {},
) =>
  httpRequest<
    DomainResponse & {
      data?: GithubComChaitinPandaWikiProApiShareV1AuthFeishuResp;
    }
  >({
    path: `/share/pro/v1/auth/feishu`,
    method: "POST",
    body: param,
    type: ContentType.Json,
    format: "json",
    ...params,
  });
